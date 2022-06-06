import { TSampleInit, makeSample } from '../../common/layout-gpu'
import triangleVertexWGSL from './vertex.wgsl'
import triangleFragmentWGSL from './fragment.wgsl'

const init: TSampleInit = async ({ canvasRef }) => {
  // powerPreference: 'high-performance',
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  if (canvasRef.current === null) {
    console.log('----canvasRef---', canvasRef)
    return
  }
  const context = canvasRef.current.getContext('webgpu');

  const devicePixelRatio = window.devicePixelRatio || 1
  const presentationSize = [
    canvasRef.current.clientWidth * devicePixelRatio, 
    canvasRef.current.clientHeight * devicePixelRatio
  ]
  const presentationFormat = context.getPreferredFormat(adapter)
  context.configure({
    device,
    format: presentationFormat,
    size: presentationSize,
  })

  const bindGroupLayout = device.createBindGroupLayout({
   entries: [
     {
       binding: 0,
       visibility: GPUShaderStage.VERTEX,
       buffer: {
         type: 'uniform'
       }
     }, {
       binding: 1,
       visibility: GPUShaderStage.FRAGMENT,
       buffer: {
         type: 'uniform'
       }
     }
   ]
  })
  const piplelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  })
  const pipeline = device.createRenderPipeline({
    layout: piplelineLayout,
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
    }
  })

  function frame() {
    // Sample is no longer the active page.
    if (!canvasRef.current) return
    
    const commandEncoder = device.createCommandEncoder()
    const textureView = context.getCurrentTexture().createView()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
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
