import { useRef, useEffect, useState } from 'react'

import './layout.scss'

export type TSampleInit = (params: { canvasRef: React.RefObject<HTMLCanvasElement> }) => void | Promise<void>

export const SampleLayout: React.FunctionComponent<
  React.PropsWithChildren<{
    name: string
    description: string
    init: TSampleInit
  }>
> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const minNum = Math.min(windowWidth, windowHeight)
  const [canvasWidth, setCanvasWidth] = useState(minNum)
  const [canvasHeight, setCanvasHeight] = useState(minNum)

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

    } catch (err) {
      console.log('***Error', err);
    }
  }, [])

  // window.addEventListener('resize', () => {
  //   setCanvasWidth(window.innerWidth)
  //   setCanvasHeight(window.innerHeight)
  //   props.init({ canvasRef })
  // })

  return (
    <div className="GPU__page">
      {/* <nav className="GPU__nav"> WebGPU Demo </nav> */}
      <div className="GPU__container">
        <div className="GPU__container-title"> {props.name} </div>
        <div className="GPU__container-desc"> {props.description} </div>
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight}></canvas>
      </div>
    </div>
  )
}

export const makeSample: (...props: Parameters<typeof SampleLayout>) => JSX.Element = (props) => {
  return <SampleLayout {...props} />
}
