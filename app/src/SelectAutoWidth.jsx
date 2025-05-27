import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function SelectAutoWidth({options, tune, handleChange}) {

  return (
    <div>
      <FormControl sx={{ m: 1, minWidth: 80}} size="small">
        <InputLabel id="demo-simple-select-autowidth-label">Tune</InputLabel>
        <Select
          labelId="demo-simple-select-autowidth-label"
          id="demo-simple-select-autowidth"
          value={tune}
          onChange={handleChange}
          autoWidth
          label="Tune"
        >
          {options.map((option, index) => (
            <MenuItem
              sx={{ fontFamily: 'Montserrat', fontSize: '12px', fontWeight: '450'}}
              value={option}
            >
            {option}
            </MenuItem>

          ))}
        </Select>
      </FormControl>
    </div>
  );
}