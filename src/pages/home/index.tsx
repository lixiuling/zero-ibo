import React from 'react'
import FirstLoading from './loading/load'
import HomeContent from './main-content/content'
import { delay } from '../../common/common'

interface Props {
  bgColor: string,
  loadColor: string,
}
interface State {
  loadingWidth: number
  isLoading: boolean,
  loadAnimationTime: number
}

class HomeApp extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props),
    this.state = {
      loadingWidth: 0,
      isLoading: true,
      loadAnimationTime: 280
    }
  }
  async componentDidMount(){
    // loading 动画
    await delay(this.state.loadAnimationTime)
    this.setState({loadingWidth: 18})
    await delay(this.state.loadAnimationTime)
    this.setState({loadingWidth: 46})
    await delay(this.state.loadAnimationTime)
    this.setState({loadingWidth: 85})
    await delay(this.state.loadAnimationTime)
    this.setState({loadingWidth: 100})
    setTimeout(() => {
      this.setState({isLoading: false})
    }, 300);
  }
  render() {
    return (
      <>
        {/* loading页面 */}
        { this.state.isLoading && 
          <FirstLoading 
            width={this.state.loadingWidth}
            bgColor={this.props.bgColor}
            loadColor={this.props.loadColor}
            animationTime={this.state.loadAnimationTime} 
          /> 
        }
        {/* 首页 */}
        { !this.state.isLoading && <HomeContent /> }
      </>
    )
  }
}

export default HomeApp