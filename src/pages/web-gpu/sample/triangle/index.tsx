import { TSampleInit, makeSample } from '../../../common/layout'
import triangleVertexWGSL from './vert.wgsl?raw'
import triangleFragmentWGSL from './fragment.wgsl?raw'
import { commomClearValue } from '../../common/index'

const init: TSampleInit = async ({ canvasRef }) => {
  // powerPreference: 'high-performance',
  const adapter = await navigator.gpu.requestAdapter()
  const device = await adapter.requestDevice()

  if (canvasRef.current === null) {
    console.log('----canvasRef---', canvasRef)
    return
  }
  const context = canvasRef.current.getContext('webgpu');
  console.log(context, '-------------')

  // const devicePixelRatio = window.devicePixelRatio || 1
  // const presentationSize = [
  //   canvasRef.current.clientWidth * devicePixelRatio, 
  //   canvasRef.current.clientHeight * devicePixelRatio
  // ]

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'opaque',
    // size: presentationSize, 已弃用，根据画布的宽度和高度
  })

  // 顶点和颜色动态传参
  // 顶点
  const vertex = new Float32Array([
    0.0, 0.5, 0.0, // 顶点1
    -0.5, -0.5, 0.0, // 顶点2
    0.5, -0.5, 0.0, // 顶点3
  ])
  const vertexBuffer = device.createBuffer({
    size: vertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  })
  new Float32Array(vertexBuffer.getMappedRange()).set(vertex)
  vertexBuffer.unmap()

  // 颜色
  const color = new Float32Array([
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,
  ])
  const colorBuffer = device.createBuffer({
    size: color.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  })
  new Float32Array(colorBuffer.getMappedRange()).set(color)
  colorBuffer.unmap()
  
  // 颜色缓冲区对象在建立完成后，是需要将其装进BindGroup中的，之后我们会将这个BindGroup 传递非渲染通道
  // const uniformBingGroupLayout = device.createBindGroupLayout({
  //   entries: [
  //     {
  //       binding: 0,
  //       visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
  //       buffer: {}
  //     }
  //   ]
  // })
  // const uniformBindGroup = device.createBindGroup({
  //   layout: uniformBingGroupLayout,
  //   entries: [
  //     {
  //       binding: 0, // 位置 
  //       resource: {
  //         buffer: colorBuffer
  //       }
  //     }
  //   ]
  // })

  /** MSAA 通过增加采样点来减轻几何体走样，边缘锯齿 */
  const sampleCount = 4
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: []
    }),
    vertex: {
      module: device.createShaderModule({
        code: triangleVertexWGSL
      }),
      entryPoint: 'main',
      buffers: [
        {
          arrayStride: 4 * 3,
          attributes: [
            {
              shaderLocation: 0, // 遍历索引
              offset: 0, // 偏移
              format: 'float32x3', // 参数格式
            }
          ]
        },
        {
          arrayStride: 4 * 3,
          attributes: [
            {
              shaderLocation: 1,
              offset: 0,
              format: 'float32x3'
            }
          ]
        }
      ]
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
      topology: 'triangle-list',
      cullMode: 'back',
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
          clearValue: commomClearValue,
          loadOp: 'clear',
          storeOp: 'store'
        }
      ]
    }
    
    // 建立渲染通道，类似图层
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    // 传入渲染管线
    passEncoder.setPipeline(pipeline)
    // 写入顶点缓冲区
    passEncoder.setVertexBuffer(0, vertexBuffer)
    passEncoder.setVertexBuffer(1, colorBuffer)
    // 把含有颜色缓冲区的BindGroup写入渲染通道
    // passEncoder.setBindGroup(0, uniformBindGroup)
    // 绘图，3 个顶点
    passEncoder.draw(3, 1, 0, 0)
    // 结束编码
    passEncoder.end()
    // 结束指令编写,并返回GPU指令缓冲区, 并向GPU提交绘图指令，所有指令将在提交后执行
    device.queue.submit([commandEncoder.finish()])

    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

const HelloTriangle: () => JSX.Element = () => makeSample({
  name: 'WebGPU Triangle',
  description: 'Show WebGPU Triangle',
  init: init
})
export default HelloTriangle
