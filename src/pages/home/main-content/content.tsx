import React from 'react';

interface ItemTypes {
  value: number | string
}
class HomeItem extends React.Component<ItemTypes> {
  render() {
    return (
      <li className="homeList__item">
        <span className="ibo-icon ibo-ziliaoku homeList__item-icon"></span>
        <span> { this.props.value } </span>
      </li>
    )
  }
}

/**
 * ！！！if 语句以及 for 循环不是 JavaScript 表达式，所以不能在 JSX 中直接使用。但是，你可以用在 JSX 以外的代码中
 * 使用时需要封装在函数里
 */
class HomeContent extends React.Component {
  render() {
    const homeTitle = 'welcome to ibo page!'
   
    const listItems = () => {
      let items = []
      const curYear = new Date().getFullYear()
      for (let i = curYear; i > 2014; i-- ) {
        const tempKey = `${i}year`
        const temp = <HomeItem value={i} key={tempKey} />
        items.push(temp)
      }
      return items
    }

    return (
      <div className="iboHome">
        <div className="iboHome__title"> { homeTitle } </div>
        <ul className="iboHome__list">
          { listItems() }
        </ul>
      </div>
    )
  }
}

export default HomeContent