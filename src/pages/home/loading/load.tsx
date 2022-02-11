import React from "react";
import './load.scss';

interface Props {
  width: number | string,
  bgColor: string,
  loadColor: string,
  [key: string]: unknown
}

class FirstLoading extends React.Component<Props> {
  render() {
    const loadBgColor = {
      backgroundColor: this.props.bgColor
    }
    const loadingBarStyle = {
      width: `${this.props.width}%`,
      backgroundColor: this.props.loadColor,
    }
    
    return (
      <div
        className="iboLoading"
        style={loadBgColor}
      >
        <div 
          className="iboLoading__bar"
          style={loadingBarStyle}
        />
      </div>
    )
  }
}

export default FirstLoading
