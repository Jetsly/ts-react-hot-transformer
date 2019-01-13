import Dva from 'dva';
import appRouter from './App';
const app = Dva();
const root = document.createElement('div');
document.body.appendChild(root);
app.router(appRouter);
app.start(root);
