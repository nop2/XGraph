from flask import Flask, jsonify, request
from flask_cors import *
from werkzeug.datastructures import FileStorage

from XGraph import *

graph: XGraph = XGraph()
app = Flask(__name__)


# 路由 控制器
@app.route('/')
def hello_world():  # put application's code here
    return 'Hello World!'


# 上传文件
@app.route('/upload', methods=['POST'])
@cross_origin(supports_credentials=True)
def upload():  # put application's code here
    try:
        # 获取文件对象
        print(request.files)
        print(request.files['node'])

        node_file: FileStorage = request.files['node']  # FileStorage
        edge_file: FileStorage = request.files['edge']  # FileStorage

        if 'relation' in request.files.keys():
            relation_file: FileStorage = request.files['relation']  # FileStorage
            # node_df = pd.read_csv(BytesIO(node_file.stream.read())) # 服务器端改写代码
        else:
            relation_file = None

        # 从流中读取文件
        if node_file is None or edge_file is None:
            return jsonify(build_error(msg='节点或边文件为空'))

        if node_file.filename.endswith('.csv'):
            node_df = pd.read_csv(node_file.stream)
        else:
            node_df = pd.read_excel(node_file.stream)

        if edge_file.filename.endswith('.csv'):
            edge_df = pd.read_csv(edge_file.stream)
        else:
            edge_df = pd.read_excel(edge_file.stream)

        if relation_file is not None and relation_file.filename != '':
            if relation_file.filename.endswith('.csv'):
                relation_df = pd.read_csv(relation_file.stream)
            else:
                relation_df = pd.read_excel(relation_file.stream)
        else:
            relation_df = None

        # 存储到图的临时数据
        graph.temp_data_table = {
            'node': node_df,
            'edge': edge_df,
            'relation': relation_df
        }
        # print(node_df.head())
        return jsonify(build_success())

    except Exception as e:
        print(e)
        return jsonify(build_error(msg=str(e)))


@app.route('/import', methods=['POST'])
@cross_origin(supports_credentials=True)
def import_data():
    """
    数据导入
    :return:
    """
    try:
        opt = request.json
        print(opt)
        graph.load(**opt)
        graph_names = list(graph.sub_graph.keys())
        return jsonify(build_success({'length': len(graph_names),
                                      'graphNames': graph_names,
                                      'columnInfo': {name: list(graph.sub_graph[name]['node_data'].columns) for name in
                                                     graph_names}}))
    except Exception as e:
        print(e)
        return jsonify(build_error(msg=str(e)))


@app.route('/get_data_table', methods=['POST'])
@cross_origin(supports_credentials=True)
def get_data_table():
    """
    获取数据表
    :return:
    """
    try:
        opt = request.json
        print(opt)
        data = graph.get_data_table(**opt)
        return jsonify(build_success(data=data))
    except Exception as e:
        print(e)
        return jsonify(build_error(msg=str(e)))


@app.route('/get_graph_info', methods=['POST'])
@cross_origin(supports_credentials=True)
def get_graph_info():
    """
    获取网络基本属性
    :return:
    """
    try:
        opt = request.json
        print(opt)
        data = graph.get_graph_info(**opt)
        return jsonify(build_success(data=data))
    except Exception as e:
        print(e)
        return jsonify(build_error(msg=str(e)))
        # raise Exception('g')


@app.route('/render_network', methods=['POST'])
@cross_origin(supports_credentials=True)
def render_network():
    """
    获得网络节点、边可视化数据
    :return:
    """
    try:
        opt = request.json
        print(opt)
        data = graph.render_network(**opt)
        return jsonify(build_success(data=data))
    except Exception as e:
        print(e)
        # raise Exception('g')
        return jsonify(build_error(msg=str(e)))


@app.route('/community_detect', methods=['POST'])
@cross_origin(supports_credentials=True)
def community_detect():
    """
    社团发现
    :return:
    """
    try:
        opt = request.json
        print(opt)
        data = graph.community_detect(**opt)
        return jsonify(build_success(data=data))
    except Exception as e:
        print(e)
        # raise Exception('g')
        return jsonify(build_error(msg=str(e)))


if __name__ == '__main__':
    app.run()
