import classNames from 'classnames';
import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import LoadButton from '../../containers/load-button.jsx';
import SaveButton from '../../containers/save-button.jsx';
import DeviceManagerButton from '../../containers/device-manager-button.jsx';
import LanguageSelector from '../../containers/language-selector.jsx';

import {
  openFeedbackForm
} from '../../reducers/modals';

import styles from './menu-bar.css';

import feedbackIcon from './icon--feedback.svg';
import deviceManagerIcon from './icon--device_manager.svg';
import scratchLogo from './scratch-logo.svg';

import greenIndicatorIcon from './icon--indicator_green.svg';
import orangeIndicatorIcon from './icon--indicator_orange.svg';
import redIndicatorIcon from './icon--indicator_red.svg';

let textChar = null;
let matrixChar = null;

const MenuBar = props => (
    <Box
        className={classNames({
            [styles.menuBar]: true
        })}
    >
        <div className={styles.mainMenu}>
            <div className={classNames(styles.logoWrapper, styles.menuItem)}>
                <img
                    alt="Scratch"
                    className={styles.scratchLogo}
                    src={scratchLogo}
                />
            </div>
            <SaveButton className={styles.menuItem} />
            <LoadButton className={styles.menuItem} />
            <LanguageSelector className={styles.menuItem} />
        </div>
        <div className={styles.buttonWrapper}>
            <img
                className={styles.indicatorIcon}
                src={orangeIndicatorIcon}
                id="gui.menuBar.deviceManagerIndicator"
            />
            <Button
                className={styles.button}
                onClick={props.onDeviceConnect}
            >
                <img
                    className={styles.buttonIcon}
                    draggable={false}
                    src={deviceManagerIcon}
                />
                <span className={styles.feedbackText}>
                    <FormattedMessage
                        defaultMessage="Connect to micro:bit"
                        description="Label for connect button"
                        id="gui.menuBar.deviceManager"
                    />
                </span>
            </Button>
        </div>
    </Box>
);

MenuBar.propTypes = {
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
    onDeviceConnect: () => {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'command') {
                if (event.data.uuid === 'text') {
                    console.log(event.data.buffer);
                    var buf = new Uint8Array(event.data.buffer.length);
                    for (var i=0; i < event.data.buffer.length; i++)
                        buf[i] = event.data.buffer.charCodeAt(i);
                    console.log(buf);
                    textChar.writeValue(buf);
                } else if (event.data.uuid === 'matrix') {
                    matrixChar.writeValue(event.data.buffer);
                }
            } else if (event.data.type === 'status') {
                console.log(event.data.status);
                if (event.data.status === 'connected')
                    document.getElementById('gui.menuBar.deviceManagerIndicator').src = greenIndicatorIcon;
                else if (event.data.status === 'disconnected')
                    document.getElementById('gui.menuBar.deviceManagerIndicator').src = orangeIndicatorIcon;
            }
        }, false);
				navigator.bluetooth.requestDevice({
						filters: [{
								services: [0xf005]
						}]
				})
				.then(device => {
            device.addEventListener('gattserverdisconnected', (event) => {
                window.postMessage({type: 'status', status: 'disconnected'}, '*');
            });
            return device.gatt.connect();
        })
				.then(server => server.getPrimaryService(0xf005))
				.then(service => {
						return Promise.all([
								service.getCharacteristic('5261da01-fa7e-42ab-850b-7c80220097cc')
								.then(characteristic => {
										characteristic.startNotifications()
										.then(characteristic => {
												characteristic.addEventListener('characteristicvaluechanged', onDataReceived);
										});
								}),
								service.getCharacteristic('5261da03-fa7e-42ab-850b-7c80220097cc')
								.then(characteristic => {
                    textChar = characteristic;
                }),
								service.getCharacteristic('5261da04-fa7e-42ab-850b-7c80220097cc')
								.then(characteristic => {
                    matrixChar = characteristic;
                })
						]).then(characteristics => {
                window.postMessage({type: 'status', status: 'connected'}, '*');
            });
				});
    }
});

function onDataReceived (event) {
    window.postMessage({type: 'data', buffer: event.target.value.buffer}, '*');
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MenuBar);
