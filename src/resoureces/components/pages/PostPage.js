import React, { useState, useEffect } from 'react';
import AxiosInstance from '../../helper/Axiosintances';
import { toast } from 'react-toastify';
import { Modal, Button, Spinner, Navbar, FormControl, Form } from 'react-bootstrap';
import { IoLockClosed, IoLockOpen } from "react-icons/io5";
import { postNewsData } from '../../Service/PostNewServices';
import '../css/userList.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const PostPage = () => {
    const [postData, setPostData] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (postData.length == 0) {
            fetchData();
        }
    }, [postData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await postNewsData();
            setPostData(res);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Lỗi khi tải dữ liệu bản tin!');
            setLoading(false);
        }
    };

    const toggleActivation = async (postId, activable) => {
        const action = activable ? 'ẩn' : 'hiện';
        MySwal.fire({
            title: `Bạn có chắc chắn muốn ${action} bài viết này không?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#f9862e',
            confirmButtonText: `Đúng, ${action} bài viết!`,
            cancelButtonText: 'Hủy',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await AxiosInstance().post(`/api/postnews/activable/${postId}`);
                    if (response && response.data.success) {
                        fetchData();
                    } else {
                        toast.error('Có lỗi xảy ra!');
                    }
                    fetchData();
                } catch (error) {
                    MySwal.fire(
                        'Error!',
                        `Error ${action}ing bài viết: ${error.message}`,
                        'error'
                    );
                }
            }
        });
    };

    const hideAllPosts = async () => {
        MySwal.fire({
            title: 'Bạn muốn ẩn tất cả bài viết?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#f9862e',
            confirmButtonText: 'Đúng, ẩn tất cả bài viết!',
            cancelButtonText: 'Hủy',
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                const hidePromises = postData.map(post =>
                    AxiosInstance().post(`/api/postnews/activable/${post._id}`, { activable: false })
                );
                try {
                    const results = await Promise.allSettled(hidePromises);
                    const hiddenPosts = results.filter(result => result.status === 'fulfilled');
                    toast.success(`${hiddenPosts.length} posts have been hidden.`);
                } catch (error) {
                    console.error('Error hiding posts:', error);
                    toast.error(`An error occurred while hiding the posts: ${error.message}`);
                } finally {
                    fetchData();
                    setLoading(false);
                }
            }
        });
    };

    const showAllPosts = async () => {
        MySwal.fire({
            title: 'Bạn muốn hiện tất cả bài viết?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#f9862e',
            confirmButtonText: 'Đúng, hiện tất cả bài viết!',
            cancelButtonText: 'Hủy',
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                const showPromises = postData.map(post =>
                    AxiosInstance().post(`/api/postnews/activable/${post._id}`, { activable: true })
                );
                try {
                    const results = await Promise.allSettled(showPromises);
                    const shownPosts = results.filter(result => result.status === 'fulfilled');
                    toast.success(`${shownPosts.length} posts have been shown.`);
                } catch (error) {
                    console.error('Error showing posts:', error);
                    toast.error(`An error occurred while showing the posts: ${error.message}`);
                } finally {
                    fetchData();
                    setLoading(false);
                }
            }
        });
    };

    const formatDate = (datetime) => {
        const date = new Date(datetime);
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const day = date.toLocaleDateString('en-GB');
        return { time, day };
    };

    const handleShowModal = (post) => {
        setSelectedPost(post);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const renderPostModal = () => {
        return showModal && selectedPost && (
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết bài viết</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p><strong>Tiêu đề:</strong> {selectedPost.title}</p>
                    <p><strong>Trạng thái:</strong> {selectedPost.activable ? "Visible" : "Hidden"}</p>
                    <p><strong>Chi tiết:</strong> {selectedPost.detail}</p>
                    <p><strong>Vị trí:</strong> {selectedPost.location}</p>
                    <p><strong>Giá:</strong> {selectedPost.price} VND</p>
                    <p><strong>Ngày đăng:</strong> {selectedPost.created_AT}</p>
                    <p><strong>Vai trò:</strong> {selectedPost.role}</p>
                    {selectedPost.brandid && (<p><strong>Nhãn hiệu:</strong> {selectedPost.brandid.nameBrand}</p>)}
                    {selectedPost.idCategory && (<p><strong>Danh mục:</strong> {selectedPost.idCategory.name}</p>)}
                    {selectedPost.userid && (<p><strong>Email:</strong> {selectedPost.userid.email}</p>)}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    };

    const filteredPostData = postData
        .filter(post => post.title.toLowerCase().includes(searchKeyword.toLowerCase()))
        .sort((a, b) => b.activable - a.activable
        );

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" role="status" />
                <p className="mt-3">Đang tải danh sách bài đăng...</p>
            </div>
        );
    }

    // Styles
    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
    };
    const cellStyle = {
        border: '1px solid #ddd',
        padding: '8px',
        textAlign: 'left',
    };
    const center = {
        border: '1px solid #ddd',
        padding: '8px',
        textAlign: 'center',
    };
    const lockedStyle = {
        backgroundColor: '#f8d7da',
    };

    return (
        <div className="container-fluid">
            <h1 className="display-4 post-page-title">Danh sách bài đăng</h1>
            <Navbar bg="light" expand="lg" className="mb-3">
                <Navbar.Brand href="#home">Tìm Kiếm</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Form inline>
                        <FormControl
                            type="text"
                            placeholder="Nhập từ muốn tìm kiếm"
                            className="mr-sm-2"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </Form>
                </Navbar.Collapse>
            </Navbar>
            <table className="table" style={tableStyle}>
                <thead>
                    <tr>
                        <th style={center}>STT</th>
                        <th style={center}>Tiều đề</th>
                        <th style={center}>Hình ảnh</th>
                        <th style={center}>Ngày tạo</th>
                        <th style={center}>Trạng thái</th>
                        <th style={center}>
                            <Button style={{ backgroundColor: '#f9862e' }} onClick={hideAllPosts}>Ẩn bài viết</Button>
                            <Button variant="success" onClick={showAllPosts} style={{ marginLeft: '10px' }}>Hiện bài viết</Button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPostData.map((post, index) => (
                        <tr key={post._id}>
                            <td style={cellStyle}>{index + 1}</td>
                            <td style={cellStyle}>{post.title}</td>
                            <td style={center}>
                                {post.files && post.files.length > 0 && (
                                    <img src={`https://datnapi.vercel.app/${post.files[0]}`} alt="post" style={{ width: '100px', height: 'auto' }} />
                                )}
                            </td>
                            <td style={center}>
                                <div>{formatDate(post.created_AT).time}<br />{formatDate(post.created_AT).day}</div>
                            </td>
                            <td style={{
                                ...center,
                                backgroundColor: post.activable ? '#c3e6cb' : '#f5c6cb',
                                color: post.activable ? 'green' : 'red',
                            }}>
                                {post.activable ? 'Hiện bài viết' : 'Ản bài viết'}
                            </td>
                            <td style={center}>
                                <Button variant="info" onClick={() => handleShowModal(post)}>
                                    Chi tiết bài viết
                                </Button>
                                <Button
                                    variant={post.activable ? 'success' : 'secondary'}
                                    onClick={() => toggleActivation(post._id, !post.activable)}
                                >
                                    {post.activable ? <IoLockOpen /> : <IoLockClosed />}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {renderPostModal()}
        </div>
    );
};

export default PostPage;
