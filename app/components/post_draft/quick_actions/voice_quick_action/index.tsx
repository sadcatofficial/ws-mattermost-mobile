import React, {useCallback, useState} from 'react';
import {useIntl} from 'react-intl';
import {Alert, StyleSheet} from 'react-native';
import AudioRecorderPlayer, {AVEncoderAudioQualityIOSType, AVEncodingOption, AudioEncoderAndroidType, AudioSourceAndroidType} from 'react-native-audio-recorder-player';

import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {ICON_SIZE} from '@constants/post_draft';
import {useTheme} from '@context/theme';
import {hasMicrophonePermission} from '@calls/actions';
import {uploadFile} from '@actions/remote/file';
import {createPost} from '@actions/remote/post';
import {useServerUrl} from '@context/server';
import {changeOpacity} from '@utils/theme';
import {logError} from '@utils/log';
import {generateId} from '@utils/general';

import type {QuickActionAttachmentProps} from '@typings/components/post_draft_quick_action';

const style = StyleSheet.create({
    icon: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    recording: {
        backgroundColor: 'red',
        borderRadius: 20,
    },
});

type Props = QuickActionAttachmentProps & {
    channelId: string;
    rootId?: string;
    onRecordingStart?: () => void;
    onRecordingStop?: () => void;
};

export default function VoiceQuickAction({
    disabled,
    channelId,
    rootId,
    onRecordingStart,
    onRecordingStop,
    testID = '',
}: Props) {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const [isRecording, setIsRecording] = useState(false);
    const [audioRecorderPlayer] = useState(new AudioRecorderPlayer());
    const [recordingStartTime, setRecordingStartTime] = useState(0);

    const startRecording = useCallback(async () => {
        try {
            const hasPermission = await hasMicrophonePermission();
            if (!hasPermission) {
                Alert.alert(
                    intl.formatMessage({
                        id: 'mobile.voice.permission_denied_title',
                        defaultMessage: 'Microphone Permission Required',
                    }),
                    intl.formatMessage({
                        id: 'mobile.voice.permission_denied_description',
                        defaultMessage: 'Please grant microphone permission to record voice messages.',
                    }),
                );
                return;
            }

            await audioRecorderPlayer.startRecorder(undefined, {
                AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
                AudioSourceAndroid: AudioSourceAndroidType.MIC,
                AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
                AVNumberOfChannelsKeyIOS: 2,
                AVFormatIDKeyIOS: AVEncodingOption.aac,
            });

            setRecordingStartTime(Date.now());
            setIsRecording(true);
            onRecordingStart?.();
        } catch (error) {
            logError('Failed to start recording', error);
            Alert.alert(
                intl.formatMessage({
                    id: 'mobile.voice.recording_error_title',
                    defaultMessage: 'Recording Error',
                }),
                intl.formatMessage({
                    id: 'mobile.voice.recording_error_description',
                    defaultMessage: 'Failed to start recording. Please try again.',
                }),
            );
        }
    }, [audioRecorderPlayer, intl, onRecordingStart]);

    const stopRecording = useCallback(async () => {
        try {
            const result = await audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
            setIsRecording(false);
            onRecordingStop?.();

            const duration = Date.now() - recordingStartTime;

            const fileInfo = {
                id: '',
                uri: result,
                name: 'Voice Message',
                size: 0,
                extension: 'mp3',
                mime_type: 'audio/mpeg',
                has_preview_image: false,
                height: 0,
                width: 0,
                user_id: '',
                clientId: generateId(),
                localPath: result,
            };

            return new Promise<void>((resolve, reject) => {
                const onComplete = (response: any) => {
                    if (response.code !== 201 || !response.data?.file_infos?.length) {
                        reject(new Error('Failed to upload file'));
                        return;
                    }

                    const uploadedFile = response.data.file_infos[0];
                    const post = {
                        channel_id: channelId,
                        root_id: rootId || '',
                        message: 'Voice Message',
                        type: 'custom_voice' as any,
                        props: {
                            fileId: uploadedFile.id,
                            duration,
                        },
                    };

                    createPost(serverUrl, post, []).then(() => resolve()).catch(reject);
                };

                const onError = (response: any) => {
                    reject(new Error(response.message || 'Upload failed'));
                };

                const {error} = uploadFile(serverUrl, fileInfo, channelId, () => {}, onComplete, onError);
                
                if (error) {
                    reject(error);
                }
            });
        } catch (error) {
            logError('Failed to stop recording or send message', error);
            Alert.alert(
                intl.formatMessage({
                    id: 'mobile.voice.send_error_title',
                    defaultMessage: 'Send Error',
                }),
                intl.formatMessage({
                    id: 'mobile.voice.send_error_description',
                    defaultMessage: 'Failed to send voice message. Please try again.',
                }),
            );
        }
    }, [audioRecorderPlayer, serverUrl, channelId, rootId, intl, onRecordingStop, recordingStartTime]);

    const handlePress = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    const actionTestID = disabled ? `${testID}.disabled` : testID;
    const color = disabled ? changeOpacity(theme.centerChannelColor, 0.16) : changeOpacity(theme.centerChannelColor, 0.64);

    return (
        <TouchableWithFeedback
            testID={actionTestID}
            disabled={disabled}
            onPress={handlePress}
            style={[style.icon, isRecording && style.recording]}
            type={'opacity'}
        >
            <CompassIcon
                color={isRecording ? 'white' : color}
                name="microphone"
                size={ICON_SIZE}
            />
        </TouchableWithFeedback>
    );
} 