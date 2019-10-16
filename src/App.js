import React, { Component } from 'react';
import './App.css';
import logo from "./logo.svg";

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      timeframes: {
        month: 12,
        week: 52,
        day: 365
      },
      timeframe: "week",
      taxBrackets: {
        Australia: {
          0: 0,
          18200: 0.19,
          37000: 0.325,
          90000: 0.37,
          180000: 0.45
        },
        "New Zealand": {
          0: 0.105,
          14000: 0.175,
          48000: 0.3,
          70000: 0.33
        },
      },
      region: "Australia",
      income: {
        preTax: 0,
        postTax: 0,
        amount: 0
      }
    }
  }

  preToAmount = pre => {
    const taxBrackets = this.state.taxBrackets[this.state.region]
    const lowerBounds = Object.keys(taxBrackets).map(value => Number(value))

    console.log(taxBrackets)

    const amount = lowerBounds
      .map((lowerBound, index) => {
        const upperBound = (index < lowerBounds.length - 1) ? lowerBounds[index + 1] : Infinity
        const bound = Math.max(lowerBound, Math.min(pre, upperBound))
        const tax = (bound - lowerBound) * taxBrackets[lowerBound]
        return Math.floor(tax * 100) / 100
      })
      .reduce((accum, curr) => (accum + curr))

    return Math.floor(amount * 100) / 100
  }

  amountToPre = post => {
    const taxBrackets = this.state.taxBrackets[this.state.region]
    const lowerBounds = Object.keys(taxBrackets).map(value => Number(value))

    const bracketAmounts = lowerBounds
      .map((lowerBound, index) => {
        const upperBound = (index < lowerBounds.length - 1) ? lowerBounds[index + 1] : Infinity
        const tax = (upperBound - lowerBound) * taxBrackets[lowerBound]
        return Math.floor(tax * 100) / 100
      })

    const bracketTotals = bracketAmounts
      .map((value, index, arr) =>
        arr.slice(0, index + 1)
          .reduce((accum, curr) => (accum + curr))
      )

    const bracketIndex = bracketTotals
      .findIndex(total => (post <= total))

    const taxAmountInBracket = (post - bracketTotals[bracketIndex - 1]) || 0
    const preTaxInBracket = taxAmountInBracket / taxBrackets[lowerBounds[bracketIndex]]
    const preTax = preTaxInBracket + lowerBounds[bracketIndex]

    return Math.floor(preTax * 100) / 100
  }

  postToPre = post => {
    const taxBrackets = this.state.taxBrackets[this.state.region]
    const lowerBounds = Object.keys(taxBrackets).map(value => Number(value))

    const bracketAmounts = lowerBounds
      .map((lowerBound, index) => {
        const upperBound = (index < lowerBounds.length - 1) ? lowerBounds[index + 1] : Infinity
        const tax = (upperBound - lowerBound) * taxBrackets[lowerBound]
        return Math.floor(tax * 100) / 100
      })

    const bracketTotals = bracketAmounts
      .map((value, index, arr) =>
          arr.slice(0, index + 1)
              .reduce((accum, curr) => (accum + curr))
      )

    const invertedLowerBounds = lowerBounds.map((lowerBound, index) => {
      return lowerBound - bracketTotals[index - 1] || 0
    })

    const bracketIndex = invertedLowerBounds.indexOf(Math.max.apply(this, invertedLowerBounds.filter(lowerBound => post >= lowerBound)))

    const baseAmount = lowerBounds[bracketIndex]
    const baseAmountInverted = invertedLowerBounds[bracketIndex]
    const taxRate = taxBrackets[baseAmount]
    const preTax = (post - baseAmountInverted) / (1 - taxRate) + baseAmount

    return Math.floor(preTax * 100) / 100
  }

  changePreTax = e => {
    const { value } = e.target
    const valueFiltered = value.match(/[0-9]*/)[0]

    const preTax = Number(valueFiltered) || ""
    let amount = this.preToAmount(preTax) || 0
    const postTax = preTax - amount || 0

    if (valueFiltered === "") {
      amount = ""
    }

    this.setState({ income: { preTax, postTax, amount } })
  }

  changeTaxAmount = e => {
    const { value } = e.target
    const valueFiltered = value.match(/[0-9]*/)[0]

    const amount = Number(valueFiltered) || ""
    let preTax = this.amountToPre(amount) || 0
    const postTax = preTax - amount || 0

    if (valueFiltered === "") {
      preTax = ""
    }

    this.setState({ income: { preTax, postTax, amount } })
  }

  changePostTax = e => {
    const { value } = e.target
    const valueFiltered = value.match(/[0-9]*/)[0]

    let postTax = Number(valueFiltered) || 0
    const preTax = this.postToPre(postTax) || 0
    const amount = this.preToAmount(preTax) || 0

    if (valueFiltered === "") {
      postTax = ""
    }

    this.setState({ income: { preTax, postTax, amount } })
  }

  updateTimeframe = e => {
    const { value } = e.target

    this.setState({ timeframe: value })
  }

  updateRegion = e => {
    const { value } = e.target

    this.setState({ region: value, income: { preTax: 0, postTax: 0, amount: 0 } })
  }

  changeHoursPerWeek = () => {}
  changeWeeksPerYear = () => {}
  changeHourlyRatePreTax = () => {}
  changeHourlyTax = () => {}
  changeHourlyRatePostTax = () => {}
  changeSpentIncomeAmount = () => {}

  render() {
    const { timeframes, timeframe, income, region } = this.state
    const { preTax, postTax, amount } = income

    const timeframeSelector = (
        <select value={timeframe} onChange={this.updateTimeframe}>
          {Object.keys(timeframes).map(timeframe => <option key={timeframe} value={timeframe}>{timeframe}</option>)}
        </select>
    )

    const regionSelector = (
        <select value={region} onChange={this.updateRegion}>
          {Object.keys(this.state.taxBrackets).map(regionName => <option key={regionName} value={regionName}>{regionName}</option>)}
        </select>
    )

    const hoursPerWeek = 20
    const weeksPerYear = 46
    const hoursPerYear = hoursPerWeek * weeksPerYear

    const hourlyRatePreTax = Math.floor(preTax / hoursPerYear * 100) / 100
    const hourlyTax = Math.floor(amount / hoursPerYear * 100) / 100
    const hourlyRatePostTax = Math.floor(postTax / hoursPerYear * 100) / 100

    const retainPercentage = Math.floor(postTax / preTax * 100 * 100) / 100
    const spentIncomeAmount = 50
    const recoveryHours = Math.floor(spentIncomeAmount / hourlyRatePostTax * 100) / 100

    return (
      <div id="container">
        <div><img src={logo} alt="Aftertax" id="logo" /></div>
        <div>Selected region: {regionSelector}</div>
        <div id="post-tax">
          To earn an after-tax income of $<input type="number" value={postTax} onChange={this.changePostTax} /> per year or <span className="value">${Math.floor(postTax / timeframes[timeframe] * 100) / 100}</span> per {timeframeSelector},
        </div>
        <div id="pre-tax">
          you need to earn a pre-tax income of $<input type="number" value={preTax} onChange={this.changePreTax} /> per year or <span className="value">${Math.floor(preTax / timeframes[timeframe] * 100) / 100}</span> per {timeframeSelector},
        </div>
        <div id="tax-amount">
          which will incur a tax of $<input type="number" value={amount} onChange={this.changeTaxAmount} /> per year or ${Math.floor(amount / timeframes[timeframe] * 100) / 100} per {timeframeSelector}.
        </div>
        <div>
          If you work <input type="number" value={hoursPerWeek} onChange={this.changeHoursPerWeek} /> hours per week,
          and are paid <input type="number" value={weeksPerYear} onChange={this.changeWeeksPerYear} /> weeks per year,
          this corresponds to an hourly rate of $<input type="number" value={hourlyRatePreTax} onChange={this.changeHourlyRatePreTax} /> before tax,
          and an hourly tax of $<input type="number" value={hourlyTax} onChange={this.changeHourlyTax} />,
          resulting in an after-tax hourly rate of $<input type="number" value={hourlyRatePostTax} onChange={this.changeHourlyRatePostTax} />.
        </div>
        <div>You retain {retainPercentage}% of your income.
          This means that to recover $<input type="number" value={spentIncomeAmount} onChange={this.changeSpentIncomeAmount} /> of spent income,
          you must work for <span className="value">{recoveryHours}</span> hours.</div>
      </div>
    )
  }
}

export default App;
