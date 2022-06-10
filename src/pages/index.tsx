import React from 'react'
import './index.scss'

import GLTriangle from './web-gl/triangle/index'
// import GPUTriangle from './web-gpu/sample/triangle'
// import GPUCube from './web-gpu/sample/cubes/index'
import GPUTwoCubes from './web-gpu/sample/cubes-two'

interface IProps {
  [key: string]: unknown
}

class WebDemo extends React.Component<IProps> {
  render() {
    const isSupportWebGpu = navigator.gpu ? true : false
    return (
      <div className="webGpu">
        {isSupportWebGpu && <GPUTwoCubes />}
        {!isSupportWebGpu && <GLTriangle  />}
      </div>
    )
  }
}

export default WebDemo