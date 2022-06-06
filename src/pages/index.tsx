import React from 'react'
import './index.scss'

import WebGLTriangle from './web-gl/triangle/index'
import WebGPUTriangle from './web-gpu/sample/triangle'

interface IProps {
  [key: string]: unknown
}

class WebDemo extends React.Component<IProps> {
  render() {
    const isSupportWebGpu = navigator.gpu ? true : false
    return (
      <div className="webGpu">
        {isSupportWebGpu && <WebGPUTriangle />}
        {!isSupportWebGpu && <WebGLTriangle  />}
      </div>
    )
  }
}

export default WebDemo