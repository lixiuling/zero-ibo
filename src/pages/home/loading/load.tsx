import React from 'react'
import './load.scss'

interface Props {
  width: number | string
  bgColor: string
  loadColor: string
  animationTime: number // 按毫秒
  [key: string]: unknown
}

class FirstLoading extends React.Component<Props> {
  render() {
    const loadBgColor = {
      backgroundColor: this.props.bgColor,
    }
    const loadingBarStyle = {
      width: `${this.props.width}%`,
      backgroundColor: this.props.loadColor,
      transition: `all linear ${this.props.animationTime}ms`,
    }

    return (
      <div className="iboLoading" style={loadBgColor}>
        <div className="iboLoading__bar" style={loadingBarStyle} />
      </div>
    )
  }
}

export default FirstLoading
