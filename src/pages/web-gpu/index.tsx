import React from 'react'
import './index.scss'
import WebGPUCanvas from './common/canvas-gpu'
import WebGLCanvas from './common/canvas-gl'

interface Props {
  [key: string]: unknown
}

class WebGPU extends React.Component<Props> {
  render() {
    let gpuDevice = null
    let isSupportWebGpu = true
    let webGpuSupportDesc = 'Supported!!!'
    const initializeWebGpu = async () => {
      // Check to ensure the user agent supports WebGPU.
      if (!('gpu' in navigator)) {
        isSupportWebGpu = false
        webGpuSupportDesc = "User agent doesn't support WebGPU."
        return false
      }
      // Request an adapter.
      const gpuAdapter = await navigator?.gpu?.requestAdapter({
        powerPreference: 'low-power', // or high-performance
      })
      // requestAdapter may resolve with null if no suitable adapters are found.
      if (!gpuAdapter) {
        isSupportWebGpu = false
        webGpuSupportDesc = 'No WebGPU adapters found.'
        return false
      }
      // Request a device.
      gpuDevice = await gpuAdapter?.requestDevice()
      interface Info {
        [key: string]: unknown
      }
      gpuDevice?.lost?.then((info: Info) => {
        isSupportWebGpu = false
        webGpuSupportDesc = `WebGPU device was lost: ${info.message}`
        gpuDevice = null
        if (info.reason != 'destroyed') {
          initializeWebGpu()
        }
      })
      // onWebGPUInitialized()
      return true
    }
    initializeWebGpu()
    return (
      <div className="webGpu">
        {isSupportWebGpu && <WebGPUCanvas desc={webGpuSupportDesc} />}
        {!isSupportWebGpu && <WebGLCanvas desc={webGpuSupportDesc} />}
      </div>
    )
  }
}

export default WebGPU
