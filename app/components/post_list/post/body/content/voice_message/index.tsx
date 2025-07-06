import React from 'react';

import AudioFile from '@components/files/audio_file';
import {buildFileUrl} from '@actions/remote/file';
import { useServerUrl } from '@context/server';
import type PostModel from '@typings/database/models/servers/post';

type Props = {
    post: PostModel;
    theme: Theme;
}


const VoiceMessage = ({post}: Props) => {
    const serverUrl = useServerUrl();

    let props: any = {};
    if (post.props) {
        if (typeof post.props === 'string') {
            try {
                props = JSON.parse(post.props);
            } catch (e) {
                console.warn('Failed to parse post.props:', e);
            }
        } else if (typeof post.props === 'object') {
            props = post.props;
        }
    }
    
    const fileId = props.fileId;

    if (!fileId) {
        return null;
    }

    const audioUrl = buildFileUrl(serverUrl, fileId);
    
    const fileInfo = {
        id: fileId,
        uri: audioUrl,
        name: 'Voice Message',
        size: 0,
        extension: 'mp3',
        mime_type: 'audio/mpeg',
        has_preview_image: false,
        height: 0,
        width: 0,
        user_id: post.userId,
    };

    return (
        <AudioFile
            file={fileInfo}
            canDownloadFiles={true}
        />
    );
};

export default VoiceMessage; 