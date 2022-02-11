import React from 'react'
import './index.scss'
import FirstLoading from './loading/load'
import HomeContent from './main-content/content'
import { IboGlobalColor } from '../../common/variable/color'
import { valentineM, valentineD } from '../../common/variable/specialDate'

class HomeApp extends React.Component {
  render() {
    let isLoading = true
    
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
      <div className="iboPage" style={iboPageStyle}>
       { isLoading && <FirstLoading width={'85'} bgColor={bgColor} loadColor={loadColor} /> }
       { !isLoading && <HomeContent /> }
      </div>
    )
  }
}

export default HomeApp