import React from 'react'
import './content.scss'

interface HomeProps {
  [key: string]: unknown
}
interface HomeState {
  mainClassName: string
}
class HomeContent extends React.Component<HomeProps, HomeState> {
  constructor(props: HomeProps) {
    super(props),
      (this.state = {
        mainClassName: 'iboHome',
      })
  }
  componentDidMount = () => {
    setTimeout(() => {
      this.setState({ mainClassName: 'iboHome active' })
    }, 280)
  }
  render() {
    const homeTitle = 'welcome to ibo page!'
    return (
      <div className={this.state.mainClassName}>
        <div className="iboHome__title"> {homeTitle} </div>
      </div>
    )
  }
}

export default HomeContent
