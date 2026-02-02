import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Stack,
} from '@mui/material'
import { CheckCircle, Warning } from '@mui/icons-material'
import './App.css'

interface HealthCheck {
  status: string
  timestamp: string
}

function App() {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkBackendHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/health')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setHealth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch backend health')
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkBackendHealth()
  }, [])

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          🌡️ Thermal Software v2.0
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Modern Architecture - NestJS + React + Docker
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Card elevation={3}>
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="h5" component="h3">
                  System Status
                </Typography>

                {loading && (
                  <Box display="flex" justifyContent="center" alignItems="center" py={3}>
                    <CircularProgress />
                  </Box>
                )}

                {error && (
                  <Alert severity="error" icon={<Warning />}>
                    <strong>Backend Connection Error:</strong> {error}
                  </Alert>
                )}

                {health && !loading && (
                  <Alert severity="success" icon={<CheckCircle />}>
                    <strong>Backend API:</strong> {health.status} - Connected at {new Date(health.timestamp).toLocaleString()}
                  </Alert>
                )}

                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>Frontend:</strong> React 18 + Vite + Material-UI
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ✅ Hot Module Replacement (HMR) enabled
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>Backend:</strong> NestJS 11 + TypeScript
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ✅ RESTful API with Swagger documentation
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>Infrastructure:</strong> Docker + Nginx + PostgreSQL + Redis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ✅ Fully containerized development environment
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={checkBackendHealth}
                    disabled={loading}
                  >
                    Refresh Health Check
                  </Button>
                  <Button
                    variant="outlined"
                    href="/api/docs"
                    target="_blank"
                  >
                    API Documentation
                  </Button>
                </Stack>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="caption" display="block">
                    <strong>Ready for Development!</strong>
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    • Edit <code>frontend/src/App.tsx</code> to see HMR in action
                  </Typography>
                  <Typography variant="caption" display="block">
                    • Create features in <code>backend/src/</code>
                  </Typography>
                  <Typography variant="caption" display="block">
                    • All changes auto-sync between host and containers
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Migration completed successfully! 🎉
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Thermal Software v2.0.0-dev | February 2026
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default App

