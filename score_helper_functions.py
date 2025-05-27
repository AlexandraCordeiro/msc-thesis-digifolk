import pandas as pd
import numpy as np
from pathlib import Path
from tqdm import tqdm
from music21 import *
import pandas as pd
from langdetect import detect
import re
import json
import traceback

viz_type = "COLLECTION"

class Score():
    def __init__(self, file):
        self.file = file
        self.score = self.load_score()
        self.key = self.get_key()
        self.meter = None
        self.instruments = self.get_instruments()
        self.tempo = None
        self.title = self.get_title()
        self.composer = self.get_composer()
        self.arranger = self.get_arranger()
        self.time_signatures = self.get_time_signature()
        self.intervals = self.get_intervals()
        # self.chord_progression = self.get_chord_progression()
        self.num_measures = self.get_num_measures()
        self.notes = self.get_all_notes()
        self.count = self.get_notes_count()
        self.lyrics = self.search_lyrics()
        self.language = self.get_most_likely_language()

    def load_score(self) -> stream.Score:
        return converter.parseFile(self.file)

    def get_time_signature(self):
        time_signatures = []
        for ts in self.score.flat.getElementsByClass(meter.TimeSignature):
            if ts.ratioString not in time_signatures:
                time_signatures.append(ts.ratioString)
        return time_signatures

    def get_num_measures(self):
        return len(self.score.parts[0].getElementsByClass(stream.Measure))

    def get_instruments(self):
        instruments = []
        for part in self.score.parts:
            inst = part.getInstrument().instrumentName
            if inst != '' and inst not in instruments:
                instruments.append(inst)
        return instruments

    def get_key(self):
        return self.score.analyze('key')

    """ def get_chord_progression(self):
        chords = self.score.chordify().recurse().getElementsByClass(chord.Chord)
        progression = []
        for i, c in enumerate(chords):
            rn = roman.romanNumeralFromChord(c, self.key)
            progression.append(rn.figure)
        return progression """

    # Metadata
    def get_composer(self):
        return self.score.metadata.composer

    def get_arranger(self):
        return self.score.metadata.arranger

    def get_title(self):
        return self.score.metadata.title

    # Print
    def attributes(self):
        print(   f'Title: {self.title}\n'
               + f'Composer: {self.composer}\n'
               + f'Arranger: {self.arranger}\n'
               + f'Key: {self.key}\n'
               + f'Instruments: {self.instruments}\n'
               + f'Time signatures: {self.time_signatures}\n'
               + f'No. Measures: {self.num_measures}\n'
               + f'Lyrics: {self.lyrics}\n'
               + f'Language: {self.language}\n'
               + f'Chord Progression: {self.chord_progression}\n'
              )

    def get_all_notes(self):
        notes = {}
        measure = []
        offset = []
        quarterLength = []
        pitch = []
        volume = []

        for note in self.score.recurse().notes:
            if note.isNote:
                measure.append(note.activeSite.measureNumber)
                offset.append(note.offset)
                quarterLength.append(note.duration.quarterLength)
                pitch.append(note.pitches[0])
                volume.append(note.volume.realized)

                n = {'offset': note.offset,
                    'quarter_length': note.duration.quarterLength,
                    'pitch': note.pitches[0],
                    'volume': note.volume.realized}

                if f'measure_{note.activeSite.measureNumber}' not in notes.keys():
                    notes[f'measure_{note.activeSite.measureNumber}'] = [n]
                else:
                    notes[f'measure_{note.activeSite.measureNumber}'].append(n)

            df = {'tune': self.file.name,
                'measure': measure,
                'offset': offset,
                'quarterLength': quarterLength,
                'pitch': pitch,
                'volume': volume}

            df = pd.DataFrame(df).sort_values(by='measure')
            # print(df.to_string())

        # print(df)
        return df
        # print(len(notes['measure_2']))
        # print()

    def search_lyrics(self):
        lyric = ''
        for part in self.score.parts:
            lyric += search.lyrics.LyricSearcher(part).indexText

        # print(lyric)
        return lyric

    def get_most_likely_language(self):
        if self.lyrics != '':
            return detect(self.lyrics)
        else:
            return None

    def get_notes_count(self):
        pitches = self.notes['pitch']
        count = {}
        # print(pitches)
        for pitch in pitches:
            # print(pitch)
            if pitch not in count.keys():
                count[pitch] = 1
            else:
                count[pitch] += 1

        df = pd.DataFrame({'pitch': count.keys(),'count': count.values()})
        # print(df.sort_values(by='count', ascending=False).to_string())
        return count

    def get_note_timestamps(self):
      score_seconds = self.score.flat.getElementsByClass(note.Note).secondsMap
      timestamps = []
      if score_seconds:
        for entry in score_seconds:
            el = entry['element']
            if isinstance(el, note.Note):
                start = entry['offsetSeconds']
                duration = entry['durationSeconds']
                end = start + duration
                timestamps.append({"note": el.nameWithOctave, "start": start, "end": end, "id": self.get_note_id(el.nameWithOctave)})
      return timestamps

    def get_note_id(self, note):
      octave = int(re.sub(r"[^0-9]+", "", note))
      acc = re.sub(r"[^#b]", "", note)
      note = re.sub(r"[^a-zA-Z]+", "", note)

      accidental = 0
      dic = {'C': 1, 'D': 2, 'E': 3, 'F': 4, 'G': 5, 'A': 6, 'B': 7}

      if acc == '#':
        accidental += 0.5
      if acc == 'b':
        accidental -= 0.5

      return (octave * 6) + (accidental) + dic[note]

    def get_intervals(self):
        notes = self.get_all_notes()['pitch']

        intervals = {}
        for i in range(len(notes) - 1):
            i = interval.Interval(notes[i], notes[i + 1])
            # print(i.niceName)
            if i.niceName not in intervals.keys():
                intervals[i.niceName] = 1
            else:
                intervals[i.niceName] += 1
        return intervals
    
def process_metadata_template(csv_filename, lyrics=None, audio_links=None) -> pd.DataFrame:

    df = pd.read_csv(csv_filename, header=None, index_col=False)

    # set row 2 as columns
    df.columns = df.iloc[2]
    # remove unnecessary rows
    df = df.drop(index=[0, 1, 2, 3, 4, 5, 6])
    # remove extra column
    df = df.drop(df.columns[0], axis=1)
    # reorder indexes
    df = df.reset_index(drop=True)
    # remove unnecessary cols from template
    cols_to_remove = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 36]
    df = df.drop(df.columns[cols_to_remove], axis=1)
    # add audio links and song lyrics
    if lyrics is None:
        lyrics = np.zeros(shape=(len(df['Identifier'])))
        lyrics[lyrics==0]=['nan']
    if audio_links is None:
        audio_links = np.zeros(shape=(len(df['Identifier'])))
        audio_links[audio_links==0]=['nan']

    df['Lyrics'] = lyrics
    df['AudioLink'] = audio_links
    # save file
    df.to_csv('data.csv', index=False)
    return df

# searches for the column regarding the links of the recordings
def get_audio_links(csv_filename):
    df = pd.read_csv(csv_filename)
    columns = [col.lower() for col in list(df.columns)]
    keywords = ['link', 'links', 'audio', 'recording']
    # print(columns)
    for i in range(len(columns)):
        if any(keyword in columns[i] for keyword in keywords):
            # print(i)
            audio_links_col = df[df.columns[i]]
            # print(audio_links_col)
            return audio_links_col

    return None

# searches for a column related to the lyrics of the song
def get_lyrics(csv_filename):
    df = pd.read_csv(csv_filename)
    columns = [col.lower() for col in list(df.columns)]
    keywords = ['word', 'words', 'lyrics', 'lyric']
    # print(columns)
    for i in range(len(columns)):
        if any(keyword in columns[i] for keyword in keywords):
            # print(i)
            lyrics_col = df[df.columns[i]]
            # print(lyrics_col)
            return lyrics_col

    return None

def get_note_id(n):
  if type(n) is not str:
    n = n.nameWithOctave

  octave = int(re.sub(r"[^0-9]+", "", n))
  acc = re.sub(r"[^#b-]", "", n)
  note = re.sub(r"[^a-zA-Z]+", "", n)

  noteValues = { "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4,
    "F": 5, "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11
  }

  if not acc:
    acc = ""
  if acc == "-":
    acc = "b"

  return noteValues[note + acc] + (octave + 1) * 12

def score_contour_info(score_all_notes, time_sig):
  contour = []

  for row in score_all_notes.iterrows():
    aux = {}
    aux['measure'] = row[1][1]
    aux['offset'] = row[1][2]
    aux['duration'] = row[1][3]
    aux['pitch'] = row[1][4].nameWithOctave
    aux['numerator'] = int(time_sig[0].split('/')[0])
    aux['denominator'] = int(time_sig[0].split('/')[1])
    aux["id"] = get_note_id(row[1][4])

    contour.append(aux)
  return contour

def remove_duplicates_and_sort_notes(notes):
  return list(sorted(set(notes)))

import re

def get_ids(notes):
  ids = []

  for n in remove_duplicates_and_sort_notes(notes):
    ids.append(get_note_id(n))
  return ids


def notes_with_octave(notes):
  notes_with_octave = []

  for n in remove_duplicates_and_sort_notes(notes):
      notes_with_octave.append(n.nameWithOctave)

  return notes_with_octave

def get_start_and_end(notes):
  octaves = []

  for n in notes_with_octave(notes):
    o = int(re.sub(r"[^0-9]+", "", n))
    octaves.append(o)

  startOctave = min(octaves)
  endOctave = max(octaves) + 1

  return [startOctave, endOctave]

def get_extremes_names_and_ids(notes):
  extremes_name = [f"C{get_start_and_end(notes)[0]}", f"C{get_start_and_end(notes)[1]}"]
  extremes_id = [get_note_id(f"C{get_start_and_end(notes)[0]}"), get_note_id(f"C{get_start_and_end(notes)[1]}")]
  return [extremes_name, extremes_id]


def get_nodes(notes):

  count_dict = {}
  if viz_type is not "COLLECTION":
    extremes_name = get_extremes_names_and_ids(notes)[0]
    extremes_id = get_extremes_names_and_ids(notes)[1]
  else:
    """ extremes_name = ["C2", "C7"]
    extremes_id = [get_note_id("C2"), get_note_id("C7")] """

    extremes = get_extremes_names_and_ids(notes)
    print(extremes)
    extremes_name = [extremes[0][0], extremes[0][1]]
    extremes_id = [extremes[1][0], extremes[1][1]]

  name_merged_list = []

  for item in extremes_name + notes_with_octave(notes):
      if item not in name_merged_list:
          name_merged_list.append(item)

  for n in name_merged_list:
      if n not in count_dict.keys():
          count_dict[n] = 0
      else:
          count_dict[n] += 1


  id_merged_list = []
  #print(extremes_id + get_ids(notes))
  for item in (extremes_id + get_ids(notes)):
      if item not in id_merged_list:
          id_merged_list.append(item)


  for note in notes:
      if note.nameWithOctave in count_dict.keys():
          count_dict[note.nameWithOctave] +=1

  frequency = list(count_dict.values())

  nodes = {'id': id_merged_list, 'name': name_merged_list, 'frequency': frequency}
  nodes = [dict(zip(nodes, i)) for i in zip(*nodes.values())]
  nodes = sorted(nodes, key=lambda x: x['id'])
  #print(nodes)
  return nodes

def get_links(notes):

  links = []
  all_notes = []

  for n in notes:
      all_notes.append(n.nameWithOctave)

  for i in range(len(all_notes) - 1):
      source = all_notes[i]
      target = all_notes[i + 1]

      for d in get_nodes(notes):
          if d['name'] == source:
              source = d['id']
          if d['name'] == target:
              target = d['id']


      found = False
      for d in links:
          if d['source'] == source and d['target'] == target:
              d['count'] += 1
              found = True
              break

      if not found:
          links.append({'source': source, 'target': target, 'count': 1})
  return links

def get_note_frequency_by_measure(notes, info):

  notes_per_measure = {}

  for row in info.iterrows():
      measure = row[1][1]
      pitch = row[1][4]

      if measure not in notes_per_measure.keys():
          if pitch is not None:
              notes_per_measure[measure] = [pitch.nameWithOctave]
          else:
              notes_per_measure[measure] = []
      else:
          notes_per_measure[measure].append(pitch.nameWithOctave)

  info_about_measures = []

  for k in range(len(notes_with_octave(notes))):
      a = []
      id = get_note_id(notes_with_octave(notes)[k])

      for key,val in notes_per_measure.items():
          d = {'measure': key, 'counter': 0}
          for elem in val:
              if elem == notes_with_octave(notes)[k]:
                  d['counter'] += 1
          a.append(d)
      info_about_measures.append({'id': id, 'measures': a})


  return info_about_measures

def get_music_intervals_info_and_save_to_folder(tune_collection):

    tune_collection = Path(tune_collection)
    mxml_files = tune_collection / 'mxml'
    print(mxml_files)
    music_intervals = tune_collection / "music_intervals"
    music_intervals.mkdir(exist_ok=True)

    for tune in tqdm(mxml_files.iterdir()):
        try:
            filename = f"{tune}".split("/")[-1].split(".")[0]
            print(f">>{tune}")
            score = Score(tune)
            info = score.get_all_notes()
            notes = list(score.get_all_notes()['pitch'])
            data = {'nodes': get_nodes(notes), 'links': get_links(notes), 'note_frequency_by_measure': get_note_frequency_by_measure(notes, info)}
            with open(music_intervals / f"{filename}_music_intervals.json", "w") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            print(f">> an error occurred: {e}")
            traceback.print_exc()

get_music_intervals_info_and_save_to_folder('./IE-2019-D-HLS')