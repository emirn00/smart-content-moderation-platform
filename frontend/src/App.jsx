import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/health')
        setHealth(response.data)
      } catch (error) {
        console.error('Error fetching health status:', error)
        setHealth({ status: 'Error', message: 'Could not connect to backend' })
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
  }, [])

  return (
    <div className="container">
      <header className="header">
        <h1>Smart Content Moderation Platform</h1>
        <p className="subtitle">Project Initialization Complete</p>
      </header>

      <main className="main">
        <section className="status-card">
          <h2>Backend Connectivity Test</h2>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Checking backend status...</p>
            </div>
          ) : (
            <div className={`status-info ${health?.status?.toLowerCase() === 'ok' ? 'success' : 'error'}`}>
              <div className="status-header">
                <span className="dot"></span>
                <h3>{health?.status === 'OK' ? 'Backend Connected' : 'Connection Failed'}</h3>
              </div>
              <p className="status-message">{health?.message}</p>
              <p className="port-info">Targeting: <code>http://localhost:5000/api/health</code></p>
            </div>
          )}
        </section>

        <section className="next-steps">
          <h3>Next Steps</h3>
          <ul>
            <li>Configure backend models</li>
            <li>Setup authentication</li>
            <li>Develop moderation dashboard</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2026 Admin Panel Study Case</p>
      </footer>
    </div>
  )
}

export default App
