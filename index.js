import divhunt from 'divhunt';
import commands from 'divhunt/commands';

commands.Fn('http.server', 3000, {
    onStart: () =>
    {
        console.log('API running on http://localhost:3000');
    }
});
