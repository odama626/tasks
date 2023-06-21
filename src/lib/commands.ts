export type Command = {
  shortcut: string;
  query: string;
  action: string;
}


export const commands = [
  {
    shortcut: 't',
    query: 'create task',
    action: 'task:create'
    
  },
  {
    shortcut: 'l',
    query: 'create list',
    action: 'list:create',
  }
];