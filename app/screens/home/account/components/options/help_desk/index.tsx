// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';

import OptionItem from '@components/option_item';
import General from '@constants/general';
import {INTERACTIVE_DIALOG} from '@constants/screens';
import {useServerUrl} from '@context/server';
import {showModal} from '@screens/navigation';
import {preventDoubleTap} from '@utils/tap';

const HelpDesk = () => {
    const serverUrl = useServerUrl();

    const openHelpDesk = useCallback(preventDoubleTap(() => {
        const config = {
            url: `${serverUrl}/plugins/${General.HELPDESK_PLUGIN_ID}/api/v1/dialogs/ticket`,
            dialog: {
                title: 'Выберите отдел',
                elements: [
                    {
                        display_name: 'Отдел',
                        name: 'department',
                        type: 'select',
                        options: [
                            {text: 'Поддержка', value: 'support'},
                            {text: 'Разработка', value: 'development'},
                        ],
                    },
                ],
                submit_label: 'Дальше',
                state: 'step1',
            },
        };
        showModal(INTERACTIVE_DIALOG, config.dialog.title, {config});
    }), [serverUrl]);

    return (
        <OptionItem
            action={openHelpDesk}
            icon='help-circle-outline'
            label='Открыть тикет'
            testID='account.help_desk.option'
            type='default'
        />
    );
};

export default HelpDesk;
