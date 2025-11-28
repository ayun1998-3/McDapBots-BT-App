import React, { useState, useEffect, useRef, type ReactNode } from 'react'
import { getControllerIcon } from './controller-profiles/controller-profile'
import Buttons from './Buttons'

export type GamepadState = Gamepad | null | undefined

const getControllerId = (gamepadState: GamepadState): ReactNode => {
  if (!gamepadState) {
    return <p className="text-white">No gamepad connected.</p>
  }

  /* eslint-disable-next-line */
  return (
    <span className="flex items-center">
      <img src={getControllerIcon(gamepadState.id)} />
      {gamepadState.id.split('(')[0]}
    </span>
  )
}

const GamepadButtons = () => {
  const [gamepadState, setGamepadState] = useState<Gamepad | null | undefined>(
    null,
  )

  const requestRef = useRef()
  const bleCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)

  const connectBluetooth = async () => {
    const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'], // Replace with your custom service UUID
      })

      const server = await device.gatt?.connect()
      if (!server) return

      const service = await server.getPrimaryService('battery_service') // replace UUID
      const characteristic = await service.getCharacteristic('battery_level') // replace UUID

      bleCharacteristicRef.current = characteristic
  }

  // PRATIK: EDIT BELOW TO SEND DATA BASED ON GAMEPAD INPUTS
  const sendBluetoothData = (gamepad: Gamepad) => {
    if (!bleCharacteristicRef.current) return

    let buttonsByte = 0
    let character = '0' // single data byte sent to bluetooth peripheral

    // Set character based on left joystick radial position
    if (gamepad.axes[0] > 0.9) { // right
      character = 'b'
    }
    else if(gamepad.axes[0] < -0.9) { // left
      character = 'd'
    }
    else if(gamepad.axes[1] > 0.9) { // down
      character = 'c'
    }
    else if(gamepad.axes[1] < -0.9) { // up
      character = 'a'
    }
    else {
      character = '0'
    }

    // Set character based on right joystick radial position
    if (gamepad.axes[2] > 0.9) { // right
      character = 'b'
    }
    else if(gamepad.axes[2] < -0.9) { // left
      character = 'd'
    }
    else if(gamepad.axes[3] > 0.9) { // down
      character = 'c'
    }
    else if(gamepad.axes[3] < -0.9) { // up
      character = 'a'
    }
    else {
      character = '0'
    }

    if (gamepad.buttons[0].pressed) { // button A
      character = 'A'
    }
    else if (gamepad.buttons[1].pressed) { // button B
      character = 'B'
    }
    else if (gamepad.buttons[2].pressed) { // button X
      character = 'X'
    }
    else if (gamepad.buttons[3].pressed) { // button Y
      character = 'Y'
    } 

    const character_byte = character.charCodeAt(0)
    const data = new Uint8Array([character_byte])

    bleCharacteristicRef.current.writeValueWithoutResponse(data)
  }


  const handleGamepad = () => {
    // Check if the browser supports the Gamepad API
    if (!navigator.getGamepads) {
      console.error(
        'Gamepad API not supported, please use a different browser.',
      )
      return
    }

    // Get the first gamepad (you can modify this logic based on your requirements)
    const gamepad = navigator.getGamepads()[0]
    // Update the state with the gamepad data
    setGamepadState(gamepad)

    if (gamepad) {
      sendBluetoothData(gamepad)
    }

    // console.log('Gamepad state updated:', gamepad)

    requestAnimationFrame(handleGamepad)
  }


  useEffect(() => {
    // Add an event listener for the gamepadconnected event
    window.addEventListener('gamepadconnected', handleGamepad)

    // Remove the event listener when the component is unmounted
    return () => {
      window.removeEventListener('gamepadconnected', handleGamepad)
      // Cancel the requestAnimationFrame when the component is unmounted
      cancelAnimationFrame(requestRef.current ?? 0)
    }
  }, [])

  return (
    <div className="p-10 text-white">
        <button
          className="mb-4 rounded bg-blue-600 px-4 py-2"
          onClick={connectBluetooth}
        >
        Connect Bluetooth
      </button>
      <h2>Gamepad connected: {getControllerId(gamepadState)}</h2>
      {gamepadState && <Buttons gamepadState={gamepadState} />}
    </div>
  )
}

export default GamepadButtons
