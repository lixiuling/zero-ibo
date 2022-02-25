import React from 'react'
import HomeApp from './pages/home'
import IboMenu from './common/component/menu/menu'
import { IboGlobalColor } from './common/variable/color'
import { valentineM, valentineD } from './common/variable/specialDate'

interface AppProps {
  [key: string]: unknown
}
interface StateProps {
  menuShow: boolean
}
class IboApp extends React.Component<AppProps, StateProps> {
  constructor(props: AppProps) {
    super(props),
      (this.state = {
        menuShow: false,
      })
  }

  // 判断loading是否已经加载完，展示menu
  loadOverCb = (value: boolean) => {
    if (value) this.setState({ menuShow: true })
  }

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
      <div className="iboPage" style={iboPageStyle}>
        <IboMenu show={this.state.menuShow} />
        <HomeApp bgColor={bgColor} loadColor={loadColor} loadOverCb={this.loadOverCb} />
      </div>
    )
  }
}

export default IboApp
