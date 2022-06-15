import { useRef, useEffect, useState } from 'react'
// import { mat4 } from 'gl-matrix'

import './layout-gpu.scss'

export type TSampleInit = (params: { canvasRef: React.RefObject<HTMLCanvasElement> }) => void | Promise<void>

export const SampleLayout: React.FunctionComponent<
  React.PropsWithChildren<{
    name: string
    description: string
    init: TSampleInit
  }>
> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)

  useEffect(() => {
    try {
      const p = props.init({
        canvasRef
      })

      if (p instanceof Promise) {
        p.catch((err: Error) => {
          console.log('***Error:', err);
        });
      }

      // const testMatrix = mat4.create()
      // console.log('-------------', testMatrix)

    } catch (err) {
      console.log('***Error', err);
    }
  }, [])

  // window.addEventListener('resize', () => {
  //   setWindowWidth(window.innerWidth)
  //   setWindowHeight(window.innerHeight)
  //   props.init({ canvasRef })
  // })

  return (
    <div className="GPU__page">
      {/* <nav className="GPU__nav"> WebGPU Demo </nav> */}
      <div className="GPU__container">
        <div className="GPU__container-title"> {props.name} </div>
        <div className="GPU__container-desc"> {props.description} </div>
        <canvas ref={canvasRef} width={windowWidth} height={windowHeight}></canvas>
      </div>
    </div>
  )
}

export const makeSample: (...props: Parameters<typeof SampleLayout>) => JSX.Element = (props) => {
  return <SampleLayout {...props} />
}



// interface IProps {
//   desc: string
// }
// const WebGPUCanvas = (props: IProps) => {
//   const createCanvas = async () => {
//     const canvas = document.createElement('canvas')
//     const context = canvas.getContext('webgpu')

//     const gpuAdapter = await navigator.gpu?.requestAdapter({
//       powerPreference: 'high-performance',
//     })
//     const gpuDevice = await gpuAdapter.requestDevice()

//     const resizeObserver = new ResizeObserver((entries) => {
//       for (const entry of entries) {
//         if (entry != canvas) continue
//         context?.configure({
//           device: gpuDevice,
//           format: context?.getPreferredFormat(gpuAdapter),
//           size: {
//             // 这以像素为单位报告画布元素的大小
//             width: entry?.devicePixelContentBoxSize[0]?.inlineSize,
//             height: entry?.devicePixelContentBoxSize[0]?.blockSize,
//           },
//         })
//       }
//     })
//     resizeObserver.observe(canvas)
//   }
//   createCanvas()

//   return <div>{props.desc}</div>
// }
// export default WebGPUCanvas