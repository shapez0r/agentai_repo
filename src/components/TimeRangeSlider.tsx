import React from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { format, subDays } from 'date-fns';

interface TimeRangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({
  value,
  onChange,
  min = 1,
  max = 30
}) => {
  const formatDate = (days: number) => {
    const date = subDays(new Date(), days);
    return format(date, 'dd MMM');
  };

  const marks = [
    { value: 1, label: 'Today' },
    { value: 7, label: '1 Week' },
    { value: 14, label: '2 Weeks' },
    { value: 30, label: '1 Month' }
  ];

  return (
    <Box sx={{ width: '100%', px: 2, py: 1 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Time Range: {formatDate(value)} - {format(new Date(), 'dd MMM')}
      </Typography>
      <Slider
        value={value}
        min={min}
        max={max}
        onChange={(_, newValue) => onChange(newValue as number)}
        marks={marks}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => formatDate(value)}
        sx={{
          '& .MuiSlider-thumb': {
            height: 24,
            width: 24,
            backgroundColor: '#fff',
            border: '2px solid currentColor',
            '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
              boxShadow: 'inherit',
            },
            '&:before': {
              display: 'none',
            },
          },
          '& .MuiSlider-valueLabel': {
            lineHeight: 1.2,
            fontSize: 12,
            background: 'unset',
            padding: 0,
            width: 32,
            height: 32,
            borderRadius: '50% 50% 50% 0',
            backgroundColor: '#1976d2',
            transformOrigin: 'bottom left',
            transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
            '&:before': { display: 'none' },
            '&.MuiSlider-valueLabelOpen': {
              transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
            },
            '& > *': {
              transform: 'rotate(45deg)',
            },
          },
        }}
      />
    </Box>
  );
};

export default TimeRangeSlider; 