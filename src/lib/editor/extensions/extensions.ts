import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '$lib/editor/extensions/taskItem';
import SlashCommand from '$lib/editor/extensions/slash';
import Link from '@tiptap/extension-link';
import { Id } from './id';

export default [
	StarterKit.configure({ commands: false }),
	TaskItem.configure({ nested: true }),
	Link,
	Id,
	TaskList,
	SlashCommand
];
