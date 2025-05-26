import { useState, seLayoutEffect, useLayoutEffect} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import GridLayout from './GridLayout.jsx'

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

function App() {
  const [width, height] = useWindowSize()

  return (
    <>
      <div className="background">
        <GridLayout/>
        
      </div>
    </>
  )
}

export default App
