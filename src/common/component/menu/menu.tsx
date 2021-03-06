import React from 'react'
import classnames from 'classnames'
import './menu.scss'

interface MemuItemProps {
  value: number | string
}
class MenuItem extends React.Component<MemuItemProps> {
  render() {
    return (
      <a className="iboMenu__list-item">
        <span className="ibo-icon ibo-ziliaoku iboMenu__list-item-icon" />
        <span> {this.props.value} </span>
      </a>
    )
  }
}

interface MenuProps {
  show: boolean
  [key: string]: unknown
}
interface MenuState {
  menuActive: boolean
}
/**
 * ！！！if 语句以及 for 循环不是 JavaScript 表达式，所以不能在 JSX 中直接使用。但是，你可以用在 JSX 以外的代码中
 * 使用时需要封装在函数里
 */
class IboMenu extends React.Component<MenuProps, MenuState> {
  constructor(props: MenuProps) {
    super(props),
      (this.state = {
        menuActive: false,
      })
  }
  handleMenuClick = (): void => {
    this.setState({ menuActive: !this.state.menuActive })
  }
  render() {
    const listItems = () => {
      const items = []
      const curYear = new Date().getFullYear()
      for (let i = curYear; i > 2014; i--) {
        const tempKey = `${i}year`
        const temp = <MenuItem value={i} key={tempKey} />
        items.push(temp)
      }
      return items
    }
    return (
      this.props.show && (
        <div className={classnames('iboMenu', { 'menu-show': this.state.menuActive })}>
          <div className="iboMenu__inner">
            <div className="iboMenu__bar">
              <div className="iboMenu__title"> menu </div>
              <div
                className={classnames('iboMenu__button', {
                  active: this.state.menuActive,
                })}
                onClick={this.handleMenuClick}
              >
                <span className="iboMenu__button-item iboMenu__button-item01" />
                <span className="iboMenu__button-item iboMenu__button-item02" />
              </div>
              <div className="iboMenu__icon">
                <span className="ibo-icon ibo-penzai13" />
              </div>
            </div>
            <div className="iboMenu__list">
              <div className="iboMenu__list-wrap">{listItems()}</div>
            </div>
          </div>
        </div>
      )
    )
  }
}

export default IboMenu
