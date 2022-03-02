import React from 'react'
import WebGPU from './pages/web-gpu'

interface ComProps {
  [key: string]: unknown
}

class WebGpuDemo extends React.Component<ComProps> {
  render() {
    return <WebGPU />
  }
}

export default WebGpuDemo
