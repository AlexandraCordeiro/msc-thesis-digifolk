import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import CollectionOfTunesRangeChart from './CollectionOfTunesRangeChart.jsx'
import ArcDiagramChart from './ArcDiagramChart.jsx'
import SelectAutoWidth from './SelectAutoWidth.jsx'
import ScrollableTabsButtonVisible from './ScrollableTabsButtonVisible.jsx'
import React from 'react'
import * as d3 from "d3"

const Item = ({children, textAlign, fontWeight}) => {
  return (
    <Box sx={{height: 'fit-content',
              textAlign: textAlign,
              color: 'black',
              fontFamily: 'montserrat',
              fontWeight: fontWeight,
              p: '1.5rem'}}>

    {children}
    </Box>
  )
}

const dividerStyle = {
  borderBottomWidth: '0.25rem',
  margin: 'auto',
  width: '70%',
  borderBottomColor: 'lightpink'}

const title = "Visualization of Folk Music"
const introText = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
const howToRead = "How to read this visualization"

import csv from './assets/tune_duration.csv'
const filenames = csv.map(d => d.id)

export default function GridLayout() {
  const [tune, setTune] = React.useState(filenames[0])

  const handleChange = (event, newValue) => {
    setTune(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, width: '100%',  alignItems: "stretch"}}>
      <Grid container spacing={2}>
        <Grid fontWeight={600} textAlign='center' size={12}>
          <Item>{title}</Item>
        </Grid>
        <Grid fontWeight={500} textAlign='center' size={5}>
          <Item>{title}</Item>
        </Grid>
        <Grid fontWeight={500} textAlign='left' size={5}>
          <Item>{introText}</Item>
        </Grid>
        <Grid fontWeight={600} textAlign='center' size={12}>
          <Item>{howToRead}</Item>
          <Divider sx={dividerStyle}></Divider>
        </Grid>
        <Grid size={12} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <ScrollableTabsButtonVisible options={filenames} tune={tune} handleChange={handleChange}/>
        </Grid>
        <Grid size={12}>
          <ArcDiagramChart tune={tune}/>
        </Grid>
        <Grid fontWeight={600} textAlign='center' size={12}>
          <Item>{"A look into the whole tune collection"}</Item>
          <Divider sx={dividerStyle}></Divider>
        </Grid>
        {/* <Grid size={12}>
          <CollectionOfTunesRangeChart tune={tune}/>
        </Grid> */}
      </Grid>
    </Box>
  )
}