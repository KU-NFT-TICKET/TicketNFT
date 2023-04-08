import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { decrement, increment, checkMetaMaskInstalled } from './counterSlice'
// import styles from './Counter.module.css'

export function Counter() {
  const count = useSelector(state => state.counter.value)
  const dispatch = useDispatch()

  return (
    <div>
      <div>
        <button
          aria-label="Increment value"
          onClick={() => dispatch(increment())}
        >
          Increment
        </button>
        <span>{count}</span>
        <button
          aria-label="Decrement value"
          onClick={() => dispatch(decrement())}
        >
          Decrement
        </button>
        <button
          aria-label="checkMetaMaskInstalled"
          onClick={() => dispatch(checkMetaMaskInstalled())}
        >
          checkMetaMaskInstalled
        </button>
      </div>
    </div>
  )
}