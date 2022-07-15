import 'antd/dist/antd.min.css'
import './index.css';
import {
    Button,
    Checkbox,
    Divider,
    Drawer,
    Empty,
    Form,
    Input,
    Layout,
    Menu,
    message,
    Modal,
    Select,
    Space,
    Table
} from 'antd';
import {
    DesktopOutlined,
    PieChartOutlined,
    FileOutlined,
    UserOutlined,
    ShareAltOutlined,
    NodeIndexOutlined,
    UploadOutlined, DownloadOutlined, FileAddOutlined, TableOutlined, TeamOutlined,
} from '@ant-design/icons';

import React, {useState} from 'react';
import {GraphVis, chart} from "../GraphVis";
import {useStore} from "../../store";
import {observer} from "mobx-react-lite";
import {http} from "../../utils/http";
import {Axios} from "axios";

const {Content, Sider} = Layout;


function getItem(label, key, icon, onClick, children) {
    return {
        key,
        icon,
        children,
        label,
        onClick: onClick
    };
}

function MyLayout() {
    // 状态管理
    const {graphStore} = useStore()

    // 菜单展开与折叠
    const [collapsed, setCollapsed] = useState(true)
    const [logoName, setLogoName] = useState('XG')
    const onCollapse = (collapsed) => {
        setCollapsed(collapsed);
        setLogoName(collapsed ? 'XG' : 'XGraph')
    };


    // 数据导入对话框
    const [dataImportModalVisible, setDataImportModalVisible] = React.useState(false);
    const [dataImportConfirmLoading, setDataImportConfirmLoading] = React.useState(false);
    const [dataImportForm] = Form.useForm()
    const onDataImportConfirm = async () => {
        setDataImportConfirmLoading(true);
        const data = await dataImportForm.validateFields()
        console.log(data)
        console.log(data.node_table_path[0])

        const ok = await graphStore.importData(data)
        // 导入数据成功后关闭对话框
        if (ok) {
            setDataImportModalVisible(false);
        }
        setDataImportConfirmLoading(false);

    };

    // 网络可视化对话框
    const [graphVisModalVisible, setGraphVisModalVisible] = React.useState(false);
    const [graphVisConfirmLoading, setGraphVisConfirmLoading] = React.useState(false);
    const [graphVisName, setGraphVisName] = React.useState(graphStore.graphNameList[0]);
    const [graphVisOptionList, setGraphVisOptionList] = React.useState([]);

    const [graphVisForm] = Form.useForm()
    const onGraphVisConfirm = async () => {
        setGraphVisConfirmLoading(true);
        const data = await graphVisForm.validateFields()
        let opt = await graphStore.getGraphOption(data)
        // 获取数据成功后关闭对话框
        setGraphVisConfirmLoading(false);
        if (opt !== null) {
            setGraphVisModalVisible(false);
            message.info('正在渲染网络')
            chart.setOption(opt)
        }

    };
    const handleGraphVisNameSelectChange = (value) => {
        console.log(value)
        let name = value
        if (name === '') {
            name = graphStore.graphNameList[0]
        }
        if (name !== '_') {
            setGraphVisName(name)
            setGraphVisOptionList([])
            setGraphVisOptionList(graphStore.graphBaseInfo.columnInfo[name])
            console.log(name)
        }

    }

    // 社团发现对话框
    const [communityDetectModalVisible, setCommunityDetectModalVisible] = React.useState(false);
    const [communityDetectConfirmLoading, setCommunityDetectConfirmLoading] = React.useState(false);
    const [communityDetectGraphName, setCommunityDetectGraphName] = React.useState(graphStore.graphNameList[0]);
    const [communityDetectForm] = Form.useForm()

    const onCommunityDetectConfirm = async () => {
        setCommunityDetectConfirmLoading(true);
        const data = await communityDetectForm.validateFields()

        let opt = await graphStore.getCommunityDetectOption(data)
        // 获取数据成功后关闭对话框
        setCommunityDetectConfirmLoading(false);

        if (opt !== null) {
            setCommunityDetectModalVisible(false)
            message.info('正在渲染网络')
            chart.setOption(opt)
        }

    };


    //数据查看窗口
    const [selectedDataTableName, setSelectedDataTableName] = useState(graphStore.graphNameList[0])
    const [dataTableDrawerVisible, setDataTableDrawerVisible] = React.useState(false);
    const handleDataTableSelectChange = (value) => {
        setSelectedDataTableName(value.value)
        // message.info(value.value)
    }
    const getDataTable = async () => {
        // console.log(typeof (selectedDataTableName) == 'undefined')
        if (selectedDataTableName === '') {
            if (graphStore.graphNameList.length === 0) {
                message.error('未导入网络数据')
                return
            } else {
                setSelectedDataTableName(graphStore.graphNameList[0])
                console.log(222)
            }
        }
        await graphStore.getDataTable({name: selectedDataTableName})
    }

    //网络信息查看窗口
    const [selectedGraphInfoName, setSelectedGraphInfoName] = useState('')
    const [graphInfoVisible, setGraphInfoVisible] = React.useState(false);
    const handleGraphInfoSelectChange = (value) => {
        setSelectedGraphInfoName(value.value)
        // message.info(value.value)
    }
    const getGraphInfo = async () => {
        await graphStore.getGraphInfo({name: selectedGraphInfoName})
    }


    // 菜单选项
    const menuItems = [
        getItem('数据导入', '数据导入', <FileAddOutlined/>, () => setDataImportModalVisible(true)),
        // getItem('数据导出', '数据导出', <DownloadOutlined/>),
        getItem('数据查看', '数据查看', <TableOutlined/>, () => setDataTableDrawerVisible(true)),
        getItem('网络信息', '网络信息', <PieChartOutlined/>, () => setGraphInfoVisible(true)),
        getItem('社团发现', '社团发现', <TeamOutlined/>, () => {
            setCommunityDetectModalVisible(true)
        }),
        getItem('网络可视化', '网络可视化', <ShareAltOutlined/>, () => setGraphVisModalVisible(true)),
        getItem('路径规划', '路径规划', <NodeIndexOutlined/>, () => {
            window.open('http://101.43.161.240:5001/')
        }),


    ];

    return (

        <Layout style={{minHeight: '100%', backgroundColor: 'white'}}>
            {/*侧边栏*/}
            <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
                <div className="logo">{logoName}</div>
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline"
                      items={menuItems}>
                </Menu>
            </Sider>

            <Layout className="site-layout">
                <Content style={{margin: '0px', backgroundColor: 'white', minHeight: '600px'}}>
                    {/*图可视化*/}
                    <GraphVis></GraphVis>
                </Content>
            </Layout>

            {/*数据导入对话框*/}
            <Modal
                title="数据导入"
                visible={dataImportModalVisible}
                onOk={onDataImportConfirm}
                confirmLoading={dataImportConfirmLoading}
                onCancel={() => {
                    setDataImportModalVisible(false);
                    setDataImportConfirmLoading(false);
                }}
                footer={<Form.Item>
                    <Button type="primary" loading={dataImportConfirmLoading} htmlType="submit"
                            onClick={onDataImportConfirm}>
                        导入
                    </Button>
                    <Button key="cancel" onClick={() =>  {
                        setDataImportModalVisible(false);
                        setDataImportConfirmLoading(false);
                    }}>
                        取消
                    </Button>
                </Form.Item>
                }>

                <Form form={dataImportForm} name="basic"
                      initialValues={
                          {
                              directed: false,
                              overlay: false,
                              name: `网络${graphStore.graphCount + 1}`,
                              node_table_path: '',
                              overlay_relation: ''
                          }}
                    // onFinish={onFinish}
                      autoComplete="off"
                >
                    {/*表单元素都需要包裹在Form.Item中*/}

                    <Form.Item label="名   称" name="name" rules={[
                        {
                            required: true,
                            message: '请输入唯一网络名',
                        },]}
                    >
                        {/*输入框*/}
                        <Input/>
                    </Form.Item>

                    <Form.Item label="节点表" name="node_table_path" rules={[
                        {
                            required: true,
                            message: '节点表不能为空',
                        },
                    ]} valuePropName='files'
                    >
                        {/*输入框*/}
                        <Input type='file'/>
                    </Form.Item>

                    <Form.Item label="边   表" name="edge_table_path"
                               rules={[
                                   {
                                       required: true,
                                       message: '边表格不能为空',
                                   },
                               ]} valuePropName='files'
                    >
                        <Input type='file'/>
                    </Form.Item>

                    <Form.Item label="关系表" name="overlay_relation"
                               rules={[
                                   {
                                       required: false,
                                       message: '',
                                   },
                               ]} valuePropName='files'
                    >
                        <Input type='file'/>
                    </Form.Item>

                    <Form.Item wrapperCol={{
                        offset: 3,
                        span: 16,
                    }}>
                        <Form.Item
                            name="directed"
                            valuePropName="checked"
                            style={{display: 'inline-block'}}
                        >
                            <Checkbox>有向图</Checkbox>
                        </Form.Item>

                        <Form.Item
                            name="overlay"
                            valuePropName="checked"
                            style={{display: 'inline-block', margin: '20 0 0 0'}}
                        >
                            <Checkbox>叠加到当前网络</Checkbox>
                        </Form.Item>
                    </Form.Item>

                </Form>
            </Modal>

            {/*网络可视化对话框*/}
            <Modal
                title="网络可视化"
                visible={graphVisModalVisible}
                onOk={onGraphVisConfirm}
                confirmLoading={graphVisConfirmLoading}
                onCancel={() => {
                    setGraphVisModalVisible(false);
                    setGraphVisConfirmLoading(false)
                }}
                footer={<Form.Item>
                    <Button type="primary" htmlType="submit" loading={graphVisConfirmLoading}
                            onClick={onGraphVisConfirm}>
                        确定
                    </Button>
                    <Button key="cancel" onClick={() => {
                        setGraphVisModalVisible(false);
                        setGraphVisConfirmLoading(false)
                    }}>
                        取消
                    </Button>
                </Form.Item>
                }>

                <Form form={graphVisForm} name="basic"
                    // initialValues={}
                    // onFinish={onFinish}
                      autoComplete="off"
                >
                    {/*表单元素都需要包裹在Form.Item中*/}

                    <Form.Item label="网络名称" name="name" valuePropName='selected'
                               rules={[{required: true, message: '请选择'}]}>
                        {/*输入框*/}
                        <Select onChange={handleGraphVisNameSelectChange}>
                            <Select.Option key='[复合网络]' value='_'>[复合网络]</Select.Option>
                            {graphStore.graphNameList.map(item =>
                                <Select.Option key={item} value={item}>{item}</Select.Option>
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item label="节点大小" name="vertex_size" valuePropName='selected'
                               rules={[{required: true, message: '请选择'}]}>
                        <Select>
                            <Select.Option key='_默认_' value='_默认_'>[默认]</Select.Option>
                            <Select.Option key='_度_' value='_度_'>[度]</Select.Option>
                            <Select.Option key='_介数_' value='_介数_'>[介数]</Select.Option>
                            <Select.Option key='_紧密中心度_' value='_紧密中心度_'>[紧密中心度]</Select.Option>

                            {graphVisOptionList.map(item =>
                                <Select.Option key={item} value={item}>{item}</Select.Option>
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item label="节点颜色" name="vertex_color" valuePropName='selected'
                               rules={[{required: true, message: '请选择'}]}>
                        <Select>
                            <Select.Option key='_随机_' value='_随机_'>[随机]</Select.Option>
                            <Select.Option key='_度_' value='_度_'>[度]</Select.Option>
                            <Select.Option key='_介数_' value='_介数_'>[介数]</Select.Option>
                            <Select.Option key='_紧密中心度_' value='_紧密中心度_'>[紧密中心度]</Select.Option>

                            {graphVisOptionList.map(item =>
                                <Select.Option key={item} value={item}>{item}</Select.Option>
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item label="节点标签" name="vertex_label" valuePropName='selected'
                               rules={[{required: true, message: '请选择'}]}>
                        <Select>
                            {graphVisOptionList.map(item =>
                                <Select.Option key={item} value={item}>{item}</Select.Option>
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item label="节点形状" name="vertex_shape" valuePropName='selected'
                               rules={[{required: true, message: '请选择'}]}>
                        <Select>
                            <Select.Option key='circle' value='circle'>圆形</Select.Option>
                            <Select.Option key='rect' value='rect'>矩形</Select.Option>
                            <Select.Option key='triangle' value='triangle'>三角形</Select.Option>
                            <Select.Option key='diamond' value='diamond'>菱形</Select.Option>
                        </Select>
                    </Form.Item>

                </Form>
            </Modal>

            {/*社团发现对话框*/}
            <Modal
                title="社团发现"
                visible={communityDetectModalVisible}
                onOk={onCommunityDetectConfirm}
                confirmLoading={communityDetectConfirmLoading}
                onCancel={() => {
                    setCommunityDetectConfirmLoading(false);
                    setCommunityDetectModalVisible(false)
                }}
                footer={<Form.Item>
                    <Button type="primary" htmlType="submit" loading={communityDetectConfirmLoading}
                            onClick={onCommunityDetectConfirm}>
                        确定
                    </Button>
                    <Button key="cancel" onClick={() => {
                        setCommunityDetectConfirmLoading(false);
                        setCommunityDetectModalVisible(false)
                    }}>
                        取消
                    </Button>
                </Form.Item>
                }>

                <Form form={communityDetectForm} name="basic"
                    // initialValues={}
                    // onFinish={onFinish}
                      autoComplete="off"
                >
                    {/*表单元素都需要包裹在Form.Item中*/}

                    <Form.Item label="网络名称" name="name" valuePropName='selected'
                               rules={[{required: true, message: '请选择'}]}>
                        {/*输入框*/}
                        <Select>
                            {graphStore.graphNameList.map(item =>
                                <Select.Option key={item} value={item}>{item}</Select.Option>
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item label="社团发现算法" name="method" valuePropName='selected'
                               rules={[{required: true, message: '请选择'}]}>
                        {/*输入框*/}
                        <Select>
                            <Select.Option key='WalkTrap' value='WalkTrap'>WalkTrap</Select.Option>
                            <Select.Option key='LabelPropagation'
                                           value='LabelPropagation'>LabelPropagation</Select.Option>
                            <Select.Option key='EdgeBetweenness' value='EdgeBetweenness'>EdgeBetweenness</Select.Option>
                            <Select.Option key='FastGreedy' value='FastGreedy'>FastGreedy</Select.Option>
                            <Select.Option key='MultiLevel' value='MultiLevel'>MultiLevel</Select.Option>
                            <Select.Option key='SpinGlass' value='SpinGlass'>SpinGlass</Select.Option>
                        </Select>
                    </Form.Item>

                </Form>
            </Modal>


            {/*查看数据表抽屉*/}
            <Drawer size='large' title="数据表" placement="right" onClose={() => setDataTableDrawerVisible(false)}
                    visible={dataTableDrawerVisible}
                    extra={
                        <Space>
                            <Select
                                labelInValue
                                // defaultValue={{value: graphStore.graphNameList[0]}}
                                style={{width: 200}}
                                onChange={
                                    handleDataTableSelectChange
                                }
                            >
                                {graphStore.graphNameList.map(item =>
                                    <Select.Option key={item} value={item}>{item}</Select.Option>
                                )}
                            </Select>
                            <Button type='primary' onClick={getDataTable}>获取数据</Button>
                        </Space>
                    }>
                <Table bordered
                       columns={graphStore.dataTable.nodes.columns}
                       dataSource={graphStore.dataTable.nodes.data}></Table>
                <Table bordered columns={graphStore.dataTable.edges.columns}
                       dataSource={graphStore.dataTable.edges.data}></Table>
            </Drawer>

            {/*查看网络信息抽屉*/}
            <Drawer title="网络信息" placement="right" onClose={() => setGraphInfoVisible(false)}
                    visible={graphInfoVisible}
                    extra={
                        <Space>
                            <Select
                                labelInValue
                                style={{width: 120}}
                                onChange={
                                    handleGraphInfoSelectChange
                                }
                            >
                                <Select.Option key='复合网络' value=''>[复合网络]</Select.Option>
                                {graphStore.graphNameList.map(item =>
                                    <Select.Option key={item} value={item}>{item}</Select.Option>
                                )}
                            </Select>
                            <Button type='primary' onClick={getGraphInfo}>查看</Button>
                        </Space>
                    }>

                <Space direction='vertical'>
                    <h3>有向图：{graphStore.graphInfo.directed ? '是' : '否'}</h3>
                    <h3>连通图：{graphStore.graphInfo.connected ? '是' : '否'}</h3>
                    <Divider></Divider>
                    <h3>节点数目：{graphStore.graphInfo.nodeCount}</h3>
                    <h3>边数目：{graphStore.graphInfo.edgeCount}</h3>
                    <Divider></Divider>
                    <h3>平均度：{graphStore.graphInfo.averageDegree}</h3>
                    <h3>最大度：{graphStore.graphInfo.maxDegree}</h3>
                    <Divider></Divider>
                    <h3>网络直径：{graphStore.graphInfo.diameter}</h3>
                    <h3>平均路经长度：{graphStore.graphInfo.averagePathLen}</h3>
                    <Divider></Divider>
                    <h3>聚集系数：{graphStore.graphInfo.globalClusteringCoefficient}</h3>
                    <h3>网络密度：{graphStore.graphInfo.density}</h3>
                </Space>

            </Drawer>
        </Layout>

    );

}

export default observer(MyLayout);
