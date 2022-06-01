import updateSpritesWGSL from './updateScriptes.wgsl'
import spriteWGSL from './sprite.wgsl'

// 适配器
const adapter = await navigator.gpu.requestAdapter({
  powerPreference: 'high-performance',
})
// 设备
const device = await adapter.requestDevice()

// 创建计算管线, 异步创建pipeline
const computePipeline = await device.createComputePipelineAsync({
  label: 'sim compute pipeline',
  layout: device.createPipelineLayout({
    bindGroupLayouts: [],
  }),
  compute: {
    module: device.createShaderModule({
      code: updateSpritesWGSL,
    }),
    entryPoint: 'main',
  },
})

// 创建渲染管线
const spriteShaderModule = device.createShaderModule({ code: spriteWGSL })
const renderPipeline = device.createRenderPipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [],
  }),
  vertex: {
    module: spriteShaderModule,
    entryPoint: 'vert_main',
    buffers: [
      {
        // instance particle buffer
        arrayStride: 4 * 4,
        stepMode: 'instance',
        attributes: [
          {
            // instance position
            shaderLocation: 0,
            offset: 0,
            format: 'float32x2',
          },
          {
            // instance velocity
            shaderLocation: 1,
            offset: 2 * 4,
            format: 'float32x2',
          },
        ],
      },
      {
        // vertex buffer
        arrayStride: 2 * 4,
        stepMode: 'vertex',
        attributes: [
          {
            // vertex positions
            shaderLocation: 2,
            offset: 0,
            format: 'float32x2',
          },
        ],
      },
    ],
  },
  fragment: {
    module: spriteShaderModule,
    entryPoint: 'frag_main',
    targets: [
      {
        format: 'r32float',
      },
    ],
  },
  primitive: {
    topology: 'triangle-list',
  },
})

// 每个个体初始位置信息
const numParticles = 1500
const initialParticleData = new Float32Array(numParticles * 4)
for (let i = 0; i < numParticles; ++i) {
  initialParticleData[4 * i + 0] = 2 * (Math.random() - 0.5)
  initialParticleData[4 * i + 1] = 2 * (Math.random() - 0.5)
  initialParticleData[4 * i + 2] = 2 * (Math.random() - 0.5) * 0.1
  initialParticleData[4 * i + 3] = 2 * (Math.random() - 0.5) * 0.1
}

// 运动规则参数，并为其创建Buffer
const simParams = {
  deltaT: 0.04,
  rule1Distance: 0.1, // 如果两个个体之间距离小于0.1，我们认为为一个群体
  rule2Distance: 0.025, // 如果两个个体之间距离小于0.025, 靠太近，需要分开一点点
  rule3Distance: 0.03, // 如果两个个体之间距离小于0.03, 靠太远，需要靠近一点点
  rule1Scale: 0.02, // 规则1权重
  rule2Scale: 0.05, // 规则2权重
  rule3Scale: 0.005, // 规则3权重
}
const simParamsBufferSize = 7 * Float32Array.BYTES_PER_ELEMENT
const simParamsBuffer = device.createBuffer({
  label: 'sim params buffer',
  size: simParamsBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

// 2套 GPUBuffer 和 GPUBindGroup 对象，一套存储当前信息，另一套存储计算结果
const particleBuffers: GPUBuffer[] = new Array(2)
const paritcleBindGroups: GPUBindGroup[] = new Array(2)
for (let i = 0; i < 2; ++i) {
  particleBuffers[i] = device.createBuffer({
    label: `parricle buffer ${i}`,
    size: initialParticleData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
    mappedAtCreation: true,
  })
  new Float32Array(particleBuffers[i].getMappedRange()).set(initialParticleData)
  particleBuffers[i].unmap()
}
for (let i = 0; i < 2; ++i) {
  paritcleBindGroups[i] = device.createBindGroup({
    label: `particle bind group ${i}`,
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: simParamsBuffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: particleBuffers[i],
          offset: 0,
          size: initialParticleData.byteLength,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: particleBuffers[(i + 1) % 2],
          offset: 0,
          size: initialParticleData.byteLength,
        },
      },
    ],
  })
}

// 设置简单的三角形表示一个鸟类个体
// prettier-ignore
const vertexBufferData = new Float32Array([
  -0.01, -0.02,
  0.01, -0.02, 
  0.0, 0.02,
])
// prettier-ignore
// const vbodata = new Float32Array([
//   // 坐标 xy  // 颜色 RGBA
//   -0.5, 0.0, 1.0, 0.0, 0.0, 1.0, // ← 顶点 1
//   0.0, 0.5, 0.0, 1.0, 0.0, 1.0, // ← 顶点 2
//   0.5, 0.0, 0.0, 0.0, 1.0, 1.0  // ← 顶点 3
// ])
const scriptVertexBufffer = device.createBuffer({
  label: 'sprite vertex buffer',
  size: vertexBufferData.byteLength,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true, // 创建时立刻映射，让 CPU 端能读写数据
})
// 实例化一个新的 Float32Array，并获取 GPUBuffer 的映射范围，传入上面的数据，这样 ArrayBuffer 就有值了
new Float32Array(scriptVertexBufffer.getMappedRange()).set(vertexBufferData)
// 一定要解除映射，GPU 才能读写
scriptVertexBufffer.unmap()
