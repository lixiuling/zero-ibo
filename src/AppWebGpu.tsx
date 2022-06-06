import React from 'react'
import WebDemo from './pages'

interface ComProps {
  [key: string]: unknown
}

class WebGpuDemo extends React.Component<ComProps> {
  render() {
    return <WebDemo />
  }
}

export default WebGpuDemo
