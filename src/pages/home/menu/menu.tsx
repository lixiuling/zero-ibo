import React from "react"
import './menu.scss'

interface MemuProps {
  value: number | string
}
class MenuItem extends React.Component<MemuProps> {
  render() {
    return (
      <li className="iboMenu__list-item">
        <span className="ibo-icon ibo-ziliaoku iboMenu__list-item-icon"></span>
        <span> { this.props.value } </span>
      </li>
    )
  }
}
/**
 * ！！！if 语句以及 for 循环不是 JavaScript 表达式，所以不能在 JSX 中直接使用。但是，你可以用在 JSX 以外的代码中
 * 使用时需要封装在函数里
 */
class IboMenu extends React.Component {
  render() {
    const listItems = () => {
      let items = []
      const curYear = new Date().getFullYear()
      for (let i = curYear; i > 2014; i-- ) {
        const tempKey = `${i}year`
        const temp = <MenuItem value={i} key={tempKey} />
        items.push(temp)
      }
      return items
    }
    return (
      <div className="iboMenu">
        <div className="iboMenu__inner">
          <div className="iboMenu__bar">
            <div className="iboMenu__title"> menu </div>
            <div className="iboMenu__button">
              <span className="iboMenu__button-01" />
              <span className=" boMenu__button-02 " />
            </div>
            <div className="iboMenu__icon"></div>
          </div>
        </div>
        {/* <ul className="iboMenu__list">
          { listItems() }
        </ul> */}
      </div>
    )
  }
}

export default IboMenu