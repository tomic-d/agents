import onetype from '@onetype/framework';
import commands from '@onetype/framework/commands';

commands.Fn('http.server', 3000, {
    onStart: () =>
    {
        console.log('API running on http://localhost:3000');
    }
});
