import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { cloneDeep } from 'lodash-es';
import { Button, Empty, Form, Input, Radio, Row, Space } from 'antd';

function generateUniqId() {
	return Math.random().toString(36).substr(2, 9);
}

const getItemStyle = (isDragging, draggableStyle, isSelected) => ({
	userSelect: 'none',
	padding: 16,
	margin: `0 0 8px 0`,
	opacity: isDragging ? 0.5 : 1,
	background: isDragging ? 'lightgreen' : 'transparent',
	border: isSelected ? '1px solid #1890ff' : '1px solid #d9d9d9',
	...draggableStyle,
});

function reorder(list, startIndex, endIndex) {
	const result = cloneDeep(list);
	const [removed] = result.splice(startIndex, 1);
	result.splice(endIndex, 0, removed);

	return [result, removed];
}

function move(source, destination, droppableSource, droppableDestination) {
	const sourceClone = cloneDeep(source);
	const destClone = cloneDeep(destination);
	const [removed] = sourceClone.splice(droppableSource.index, 1);
	removed.title = '';
	removed.type = removed.id;
	removed.id = `${removed.id}_${generateUniqId()}`;
	destClone.splice(droppableDestination.index, 0, removed);
	return [destClone, removed];
}

function copy(source, id) {
	const sourceClone = cloneDeep(source);
	const index = sourceClone.findIndex((item) => item.id === id);
	const copyItem = cloneDeep(sourceClone[index]);
	copyItem.id = `${copyItem.type}_${generateUniqId()}`;
	sourceClone.splice(index + 1, 0, copyItem);
	return [sourceClone, copyItem];
}
const QUESTION_TYPE_LIST = [
	{
		id: 'SINGLE',
		content: '单选题',
	},
	{
		id: 'MULTIPLE',
		content: '多选题',
	},
	{
		id: 'SORT',
		content: '排序题',
	},
	{
		id: 'FILL',
		content: '填空题',
	},
	{
		id: 'ESSAY',
		content: '问答题',
	},
];
const QUESTION_TYPE_MAP = {
	SINGLE: '单选题',
	MULTIPLE: '多选题',
	SORT: '排序题',
	FILL: '填空题',
	ESSAY: '问答题',
};

function App() {
	const [questionList, setQuestionList] = useState([]);
	const [formInstance] = Form.useForm();
	const [selectQuestionId, setSelectQuestionId] = useState(null);

	function onDragEnd({ source, destination }) {
		if (!destination || destination?.droppableId === 'questionType') {
			return;
		}
		const [items, selectedItem] =
			source.droppableId === destination.droppableId
				? reorder(questionList, source.index, destination.index)
				: move(QUESTION_TYPE_LIST, questionList, cloneDeep(source), cloneDeep(destination));
		setQuestionList(items);
		selectQuestion(selectedItem);
	}

	function deleteQuestion(e, id) {
		e.stopPropagation();
		const items = questionList.filter((item) => item.id !== id);
		setQuestionList(items);
		setSelectQuestionId(null);
		formInstance.resetFields();
	}

	function copyQuestion(e, id) {
		e.stopPropagation();
		const [items, selectedItem] = copy(cloneDeep(questionList), id);
		setQuestionList(items);
		selectQuestion(selectedItem);
	}

	function selectQuestion(item) {
		formInstance.setFieldsValue(item);
		setSelectQuestionId(item.id);
	}

	function handleFormChange(_, allValues) {
		const { title, type } = allValues;
		const items = cloneDeep(questionList);
		if (selectQuestionId) {
			const changeItem = items.find((item) => item.id === selectQuestionId);
			changeItem.title = title;
			changeItem.type = type;
			setQuestionList(items);
		}
	}
	return (
		<main>
			<DragDropContext onDragEnd={onDragEnd}>
				<Droppable droppableId="questionType" isDropDisabled>
					{(dropableProvided) => (
						<div ref={dropableProvided.innerRef} className="left">
							{QUESTION_TYPE_LIST.map((item, index) => (
								<Draggable key={item.id} draggableId={item.id} index={index}>
									{(provided, snapshot) => (
										<div
											className="box"
											ref={provided.innerRef}
											{...provided.draggableProps}
											{...provided.dragHandleProps}
											style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
										>
											{item.content}
										</div>
									)}
								</Draggable>
							))}
						</div>
					)}
				</Droppable>
				<Droppable droppableId="questionWrapper">
					{(provided) => (
						<div ref={provided.innerRef} className="center">
							{questionList.length > 0 ? (
								questionList.map((item, index) => (
									<Draggable key={item.id} draggableId={item.id} index={index}>
										{(draggableProvided, draggableSnapshot) => (
											<div
												className="box"
												ref={draggableProvided.innerRef}
												{...draggableProvided.draggableProps}
												{...draggableProvided.dragHandleProps}
												style={getItemStyle(draggableSnapshot.isDragging, draggableProvided.draggableProps.style, item.id === selectQuestionId)}
												onClick={() => selectQuestion(item)}
											>
												<Row justify="space-between" align="middle">
													({QUESTION_TYPE_MAP[item.type]}){item.title}
													<Space>
														<Button type="primary" onClick={(e) => copyQuestion(e, item.id)}>
															Copy
														</Button>
														<Button type="primary" danger onClick={(e) => deleteQuestion(e, item.id)}>
															Delete
														</Button>
													</Space>
												</Row>
											</div>
										)}
									</Draggable>
								))
							) : (
								<Empty />
							)}
						</div>
					)}
				</Droppable>
			</DragDropContext>
			<div className="right">
				<Form
					form={formInstance}
					layout="vertical"
					initialValues={{
						id: null,
						title: '',
						type: 'SINGLE',
					}}
					onValuesChange={handleFormChange}
				>
					<Form.Item label="标题" name="title">
						<Input />
					</Form.Item>
					<Form.Item label="类型" name="type">
						<Radio.Group name="type">
							{QUESTION_TYPE_LIST.map((item) => (
								<Radio key={item.id} value={item.id}>
									{item.content}
								</Radio>
							))}
						</Radio.Group>
					</Form.Item>
				</Form>
			</div>
		</main>
	);
}
export default App;
