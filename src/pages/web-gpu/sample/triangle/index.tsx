import { TSampleInit, makeSample } from '../../common/layout-gpu'
import triangleVertexWGSL from './vert.wgsl?raw'
import triangleFragmentWGSL from './fragment.wgsl?raw'

const init: TSampleInit = async ({ canvasRef }) => {
  // powerPreference: 'high-performance',
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  if (canvasRef.current === null) {
    console.log('----canvasRef---', canvasRef)
    return
  }
  const context = canvasRef.current.getContext('webgpu');

  // const devicePixelRatio = window.devicePixelRatio || 1
  // const presentationSize = [
  //   canvasRef.current.clientWidth * devicePixelRatio, 
  //   canvasRef.current.clientHeight * devicePixelRatio
  // ]

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device,
    format: presentationFormat,
    compositingAlphaMode: 'opaque',
    // size: presentationSize, 已弃用，根据画布的宽度和高度
  })

  /** MSAA 通过增加采样点来减轻几何体走样，边缘锯齿 */
  const sampleCount = 4

  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [] }),
    vertex: {
      module: device.createShaderModule({
        code: triangleVertexWGSL
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: triangleFragmentWGSL
      }),
      entryPoint: 'main',
      targets: [
        {
          format: presentationFormat
        }
      ]
    },
    primitive: {
      topology: 'triangle-list'
    },
    multisample: {
      count: sampleCount
    }
  })

  const texture = device.createTexture({
    size: {
      width: canvasRef.current.clientWidth,
      height: canvasRef.current.clientHeight
    },
    sampleCount: sampleCount,
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  })
  const msaa_texture = texture.createView()

  function frame() {
    // Sample is no longer the active page.
    if (!canvasRef.current) return
    
    const commandEncoder = device.createCommandEncoder()
    const textureView = context.getCurrentTexture().createView()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: msaa_texture,
          resolveTarget: textureView,
          clearValue: { r: 0.85, g: 1.0, b: 0.85, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store'
        }
      ]
    }
    
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.draw(3, 1, 0, 0)
    passEncoder.end()

    device.queue.submit([commandEncoder.finish()])
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

const HelloTriangle: () => JSX.Element = () => makeSample({
  name: 'Hello Triangle',
  description: 'Show Triangle',
  init: init
})
export default HelloTriangle
