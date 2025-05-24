import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import GridLayout from './GridLayout.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="background">
        <GridLayout/>
        
      </div>
    </>
  )
}

export default App
