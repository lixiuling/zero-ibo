interface IProps {
  desc: string
}

const WebGPUCanvas = (props: IProps) => {
  const createCanvas = async () => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgpu')

    const gpuAdapter = await navigator.gpu?.requestAdapter({
      powerPreference: 'high-performance',
    })
    const gpuDevice = await gpuAdapter.requestDevice()

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry != canvas) continue
        context?.configure({
          device: gpuDevice,
          format: context?.getPreferredFormat(gpuAdapter),
          size: {
            // 这以像素为单位报告画布元素的大小
            width: entry?.devicePixelContentBoxSize[0]?.inlineSize,
            height: entry?.devicePixelContentBoxSize[0]?.blockSize,
          },
        })
      }
    })
    resizeObserver.observe(canvas)
  }
  createCanvas()

  return <div>{props.desc}</div>
}

export default WebGPUCanvas
