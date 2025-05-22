import matplotlib.pyplot as plt
from pathlib import Path
import librosa.display
import pandas as pd
import numpy as np
import librosa

# Util functions

# returns an audio times series as an array of floating point numbers representing amplitude
def audio_time_series(audio_path, start, end):
  # whole song
  if end == None:
    y, sr = librosa.load(audio_path, sr=22050)
  else:
     y, sr = librosa.load(audio_path, sr=22050, offset=start, duration=start-end)     
  return y, sr

def display_waveform(y, sr):
  fig,ax = plt.subplots()
  librosa.display.waveshow(y, sr=sr, ax=ax)
  ax.set(title='Amplitude over time')
  plt.xlabel('Time (Seconds)')
  plt.ylabel('Amplitude')
  plt.show()

def rms(y):
  return librosa.feature.rms(y=y, frame_length=2048, hop_length=256)[0]

def get_onsets(y, sr):
  # Detect onsets
  onset_frames = librosa.onset.onset_detect(y=y, sr=sr, hop_length=256, backtrack=True)
  onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=256)
  return onset_frames, onset_times

def get_fundamental_frequency(y, sr, spectogram_data):
    f0, voiced_flag, voiced_probs = librosa.pyin(y, sr=sr, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
    time_f0 = librosa.times_like(f0, sr=sr)
    f0[np.isnan(f0)] = 0
    df = pd.DataFrame(spectogram_data)
    df['freq'] = pd.to_numeric(df['freq'], errors='coerce')


    f0_db = []
    a = df.loc[((df['freq']) >= min(f0)) & (df['freq'] <= max(f0))]

    for f in f0:
        df_closest = df.iloc[(a['freq']-f).abs().argsort()[:1]]
        f0_db.append(df_closest['db'].values[0])

    return f0, time_f0, f0_db

def get_spectogram_data(y, sr):
    # Compute Short-Time Fourier Transform (STFT)
    # n_fft=1024 to reduce the amount od datapoints
    D = librosa.stft(y, n_fft=1024, hop_length=256)
    S_db = librosa.amplitude_to_db(abs(D))
    db_values = S_db
    freqs = librosa.fft_frequencies(sr=sr, n_fft=1024)
    time_spectogram = librosa.times_like(D)

    spectogram_data = []
    for bin, dbs in enumerate(db_values):
        for i, db in enumerate(dbs):
            spectogram_data.append({"time": str(time_spectogram[i]), "bin": str(bin), "db": str(db), "freq": str(freqs[bin])})

    print(D.shape)
    return spectogram_data
    