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

let rxChar = null;

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
                        defaultMessage="Connect to ScratchBit"
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
                    rxChar.writeValue(buf);
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
								services: ['4cdbbd87-d6e6-46c2-9d0b-df87551e159a']
						}]
				})
				.then(device => {
            device.addEventListener('gattserverdisconnected', (event) => {
                window.postMessage({type: 'status', status: 'disconnected'}, '*');
            });
            return device.gatt.connect();
        })
				.then(server => server.getPrimaryService('4cdbbd87-d6e6-46c2-9d0b-df87551e159a'))
				.then(service => {
						return Promise.all([
								service.getCharacteristic('4cdb8702-d6e6-46c2-9d0b-df87551e159a')
								.then(characteristic => {
										characteristic.startNotifications()
										.then(characteristic => {
												characteristic.addEventListener('characteristicvaluechanged', onDataReceived);
										});
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
