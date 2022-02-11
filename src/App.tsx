import React from "react"
import HomeApp from "./pages/home"
import { IboGlobalColor } from './common/variable/color'
import { valentineM, valentineD } from './common/variable/specialDate'

class IboApp extends React.Component {
  render() {
     // 主题色
     const themeColor = () => { 
      const currM: number = new Date().getMonth() + 1
      const currD: number = new Date().getDate()
      if (valentineM.includes(currM) && valentineD.includes(currD)) {
        return IboGlobalColor.valentine
      } else {
        return IboGlobalColor.normal
      }
    }
    const { bgColor = '#f0fcff', color = '#057748', loadColor = '#a4e2c6' } = themeColor()
    const iboPageStyle = {
      color: color,
      backgroundColor: bgColor,
    }
    
    return (
      <div 
        className="iboPage"
        style={iboPageStyle}
      >
        <HomeApp bgColor={bgColor} loadColor={loadColor}  />
      </div>
    )
  }
}

export default IboApp
