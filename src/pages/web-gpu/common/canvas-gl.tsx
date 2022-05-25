interface IProps {
  desc: string
}

const WebGLCanvas = (props: IProps) => {
  return (
    <div>
      <div> {props.desc} </div>
      <div> WebGL </div>
    </div>
  )
}

export default WebGLCanvas
