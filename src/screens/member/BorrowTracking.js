import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Text,
    Modal,
    ActivityIndicator,
    Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { borrowingRequestAPI, penaltiesAPI, penaltyDetailAPI, penaltyPoliciesAPI, borrowingGroupAPI } from '../../services/api';
import MemberLayout from '../../components/MemberLayout';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

const BorrowTracking = ({ user, onLogout }) => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Tracking Mode State
    const [trackingMode, setTrackingMode] = useState('self'); // 'self' | 'leader'
    const [leaderId, setLeaderId] = useState(null);
    const [hasGroup, setHasGroup] = useState(false);

    // Penalty related states
    const [penaltyInfo, setPenaltyInfo] = useState(null);
    const [penaltyDetails, setPenaltyDetails] = useState([]);
    const [loadingPenalty, setLoadingPenalty] = useState(false);

    // Load Group Info on Mount
    useEffect(() => {
        const loadGroupInfo = async () => {
            if (!user?.id) return;
            try {
                const groups = await borrowingGroupAPI.getByAccountId(user.id);
                if (groups && groups.length > 0) {
                    setHasGroup(true);
                    const groupId = groups[0].studentGroupId;
                    // Get members to find leader
                    const members = await borrowingGroupAPI.getByStudentGroupId(groupId);
                    if (members) {
                        const leader = members.find(m => (m.roles || '').toUpperCase() === 'LEADER');
                        if (leader) {
                            setLeaderId(leader.accountId);
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading group info:", err);
            }
        };

        loadGroupInfo();
    }, [user]);

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user, trackingMode, leaderId]);

    const loadData = async () => {
        setLoading(true);
        try {
            let targetId = user.id;

            if (trackingMode === 'leader') {
                if (!leaderId) {
                    setRequests([]);
                    setLoading(false);
                    return;
                }
                targetId = leaderId;
            }

            console.log(`Loading requests for ${trackingMode} (ID: ${targetId})`);
            const response = await borrowingRequestAPI.getByUser(targetId);
            let data = Array.isArray(response) ? response : (response?.data || []);

            // Sort by createdAt descending
            const sortedRequests = data.slice().sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // Map to consistent format
            const mappedRequests = sortedRequests.map(request => {
                const borrowDate = request.approvedDate || request.borrowDate || request.startDate || request.createdAt;
                const dueDate = request.expectReturnDate || request.dueDate;
                const returnDate = request.actualReturnDate || request.returnDate || null;
                let duration = request.duration;

                if (!duration && borrowDate && (returnDate || dueDate)) {
                    const start = dayjs(borrowDate);
                    const end = dayjs(returnDate || dueDate);
                    if (start.isValid() && end.isValid()) {
                        const diff = end.diff(start, 'day');
                        duration = diff >= 0 ? diff : 0;
                    }
                }

                return {
                    ...request,
                    kitName: request.kitName || request.kit?.kitName || 'Unknown Kit',
                    rentalId: request.requestCode || request.rentalId || request.id || request.code || 'N/A',
                    borrowDate,
                    dueDate,
                    returnDate,
                    duration: duration ?? 0,
                    status: (request.status || 'PENDING').toUpperCase(),
                    totalCost: request.totalCost || request.cost || 0,
                    depositAmount: request.depositAmount || request.deposit || 0,
                    qrCode: request.qrCode || request.qrCodeUrl || request.data?.qrCode || null,
                };
            });

            setRequests(mappedRequests);
        } catch (error) {
            console.error('Error loading borrowing requests:', error);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleRequestPress = async (request) => {
        setSelectedRequest(request);
        setDetailModalVisible(true);
        setPenaltyInfo(null);
        setPenaltyDetails([]);

        const status = (request.status || '').toUpperCase();
        if (status === 'RETURNED' || status === 'COMPLETED') {
            loadPenaltyInfo(request);
        }
    };

    const loadPenaltyInfo = async (request) => {
        setLoadingPenalty(true);
        try {
            // 1. Check if penalty is attached to request object directly
            let penalty = request.penalty || null;

            // 2. If not, try to fetch all penalties for account and match
            if (!penalty) {
                const penaltiesResponse = await penaltiesAPI.getPenByAccount();
                let penaltiesData = [];
                if (Array.isArray(penaltiesResponse)) {
                    penaltiesData = penaltiesResponse;
                } else if (penaltiesResponse?.data && Array.isArray(penaltiesResponse.data)) {
                    penaltiesData = penaltiesResponse.data;
                }

                const rentalRawId = request.id;
                penalty = penaltiesData.find((p) =>
                    (p.borrowRequestId && p.borrowRequestId === rentalRawId) ||
                    (p.request && p.request.id === rentalRawId) ||
                    (p.requestId && p.requestId === rentalRawId)
                );
            }

            if (!penalty) {
                // Fallback: try by request ID specifically
                try {
                    const pResp = await penaltiesAPI.getPenaltyByRequestId(request.id);
                    if (pResp && pResp.data) penalty = pResp.data;
                } catch (e) {/* ignore */ }
            }

            if (penalty) {
                setPenaltyInfo(penalty);

                // Load details
                try {
                    const detailsResponse = await penaltyDetailAPI.findByPenaltyId(penalty.id);
                    let detailsData = [];
                    if (Array.isArray(detailsResponse)) detailsData = detailsResponse;
                    else if (detailsResponse?.data && Array.isArray(detailsResponse.data)) detailsData = detailsResponse.data;
                    else if (detailsResponse?.id) detailsData = [detailsResponse];
                    else if (detailsResponse?.data?.id) detailsData = [detailsResponse.data];

                    if (detailsData.length > 0) {
                        // Enrich with policy info
                        const detailsWithPolicies = await Promise.all(
                            detailsData.map(async (detail) => {
                                if (!detail.policiesId) return { ...detail, policy: null };
                                try {
                                    const policyResponse = await penaltyPoliciesAPI.getById(detail.policiesId);
                                    return { ...detail, policy: policyResponse?.data || policyResponse };
                                } catch (e) {
                                    return { ...detail, policy: null };
                                }
                            })
                        );
                        setPenaltyDetails(detailsWithPolicies);
                    }
                } catch (err) {
                    console.error('Error loading penalty details:', err);
                }
            }
        } catch (error) {
            console.error('Error loading penalty info:', error);
        } finally {
            setLoadingPenalty(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
            case 'BORROWED':
                return '#52c41a';
            case 'PENDING':
            case 'WAITING_APPROVAL':
                return '#faad14';
            case 'REJECTED':
            case 'CANCELLED':
                return '#ff4d4f';
            case 'RETURNED':
            case 'COMPLETED':
                return '#1890ff';
            case 'OVERDUE':
                return '#722ed1';
            default:
                return '#666';
        }
    };

    const renderRequestItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleRequestPress(item)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: '#667eea15' }]}>
                        <Icon name="inventory-2" size={24} color="#667eea" />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.kitName} numberOfLines={1}>
                            {item.kitName}
                        </Text>
                        <Text style={styles.rentalId}>ID: {item.rentalId}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Icon name="schedule" size={16} color="#666" />
                    <Text style={styles.infoText}>
                        Due: {item.dueDate ? dayjs(item.dueDate).format('DD/MM/YYYY') : 'N/A'}
                    </Text>
                </View>
                {item.returnDate && (
                    <View style={styles.infoRow}>
                        <Icon name="check-circle" size={16} color="#52c41a" />
                        <Text style={styles.infoText}>
                            Returned: {dayjs(item.returnDate).format('DD/MM/YYYY')}
                        </Text>
                    </View>
                )}
                <View style={styles.infoRow}>
                    <Icon name="attach-money" size={16} color="#faad14" />
                    <Text style={styles.infoText}>
                        Cost: {item.totalCost?.toLocaleString() || '0'} VND
                    </Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.viewButton} onPress={() => handleRequestPress(item)}>
                    <Text style={styles.viewButtonText}>View Details</Text>
                    <Icon name="chevron-right" size={20} color="#667eea" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <MemberLayout
            title="Borrow Tracking"
            enableBack={false}
        >
            <View style={styles.container}>
                {/* Tracking Mode Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, trackingMode === 'self' && styles.toggleButtonActive]}
                        onPress={() => setTrackingMode('self')}
                    >
                        <Text style={[styles.toggleText, trackingMode === 'self' && styles.toggleTextActive]}>My Requests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, trackingMode === 'leader' && styles.toggleButtonActive, !hasGroup && styles.toggleButtonDisabled]}
                        onPress={() => hasGroup && setTrackingMode('leader')}
                        disabled={!hasGroup}
                    >
                        <Text style={[styles.toggleText, trackingMode === 'leader' && styles.toggleTextActive, !hasGroup && styles.toggleTextDisabled]}>Group Requests</Text>
                    </TouchableOpacity>
                </View>

                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#667eea" />
                    </View>
                ) : (
                    <FlatList
                        data={requests}
                        renderItem={renderRequestItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Icon name="history" size={64} color="#ddd" />
                                <Text style={styles.emptyText}>No borrowing requests found</Text>
                            </View>
                        }
                    />
                )}

                {/* Detail Modal */}
                <Modal
                    visible={detailModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setDetailModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Request Details</Text>
                                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                                    <Icon name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                {selectedRequest && (
                                    <>
                                        <View style={styles.detailSection}>
                                            <Text style={styles.sectionTitle}>Kit Information</Text>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Kit Name:</Text>
                                                <Text style={styles.detailValue}>{selectedRequest.kitName}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Status:</Text>
                                                <View style={[styles.badge, { backgroundColor: `${getStatusColor(selectedRequest.status)}15` }]}>
                                                    <Text style={[styles.badgeText, { color: getStatusColor(selectedRequest.status) }]}>
                                                        {selectedRequest.status}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Request ID:</Text>
                                                <Text style={styles.detailValue}>{selectedRequest.rentalId}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.detailSection}>
                                            <Text style={styles.sectionTitle}>Dates</Text>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Requested:</Text>
                                                <Text style={styles.detailValue}>
                                                    {selectedRequest.borrowDate ? dayjs(selectedRequest.borrowDate).format('DD/MM/YYYY HH:mm') : 'N/A'}
                                                </Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Due Date:</Text>
                                                <Text style={styles.detailValue}>
                                                    {selectedRequest.dueDate ? dayjs(selectedRequest.dueDate).format('DD/MM/YYYY HH:mm') : 'N/A'}
                                                </Text>
                                            </View>
                                            {selectedRequest.returnDate && (
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Returned:</Text>
                                                    <Text style={styles.detailValue}>{dayjs(selectedRequest.returnDate).format('DD/MM/YYYY HH:mm')}</Text>
                                                </View>
                                            )}
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Duration:</Text>
                                                <Text style={styles.detailValue}>{selectedRequest.duration} days</Text>
                                            </View>
                                        </View>

                                        <View style={styles.detailSection}>
                                            <Text style={styles.sectionTitle}>Financial</Text>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Total Cost:</Text>
                                                <Text style={[styles.detailValue, { color: '#ff4d4f', fontSize: 18 }]}>
                                                    -{selectedRequest.totalCost?.toLocaleString() || '0'} VND
                                                </Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Deposit Amount:</Text>
                                                <Text style={styles.detailValue}>
                                                    {selectedRequest.depositAmount?.toLocaleString() || '0'} VND
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Penalty Information */}
                                        {(selectedRequest.status === 'RETURNED' || selectedRequest.status === 'COMPLETED') && (
                                            <View style={styles.detailSection}>
                                                <Text style={styles.sectionTitle}>Penalty Information</Text>
                                                {loadingPenalty ? (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <ActivityIndicator size="small" color="#667eea" />
                                                        <Text style={{ marginLeft: 8, color: '#666' }}>Loading penalty details...</Text>
                                                    </View>
                                                ) : penaltyInfo ? (
                                                    <>
                                                        <View style={styles.detailRow}>
                                                            <Text style={styles.detailLabel}>Status:</Text>
                                                            <Text style={[styles.detailValue, { color: penaltyInfo.resolved ? '#52c41a' : '#ff4d4f' }]}>
                                                                {penaltyInfo.resolved ? 'Resolved' : 'Unresolved'}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.detailRow}>
                                                            <Text style={styles.detailLabel}>Amount:</Text>
                                                            <Text style={[styles.detailValue, { color: '#ff4d4f', fontSize: 18 }]}>
                                                                -{penaltyInfo.totalAmount?.toLocaleString() || 0} VND
                                                            </Text>
                                                        </View>
                                                        {penaltyDetails.length > 0 && (
                                                            <View style={{ marginTop: 8 }}>
                                                                <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Details:</Text>
                                                                {penaltyDetails.map((detail, idx) => (
                                                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                                                        <Text style={{ fontSize: 13, color: '#555', flex: 1 }}>{detail.description || detail.policy?.policyName || 'Fine'}</Text>
                                                                        <Text style={{ fontSize: 13, color: '#ff4d4f' }}>-{detail.amount?.toLocaleString()} VND</Text>
                                                                    </View>
                                                                ))}
                                                            </View>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Text style={{ color: '#999', fontStyle: 'italic' }}>No penalty found.</Text>
                                                )}
                                            </View>
                                        )}

                                        {/* QR Code */}
                                        {selectedRequest.qrCode && (
                                            <View style={styles.detailSection}>
                                                <Text style={styles.sectionTitle}>QR Code</Text>
                                                <View style={styles.qrCodeContainer}>
                                                    {(() => {
                                                        const qrCode = selectedRequest.qrCode;
                                                        if (typeof qrCode === 'string' && (qrCode.startsWith('http') || qrCode.startsWith('data:image'))) {
                                                            return <Image source={{ uri: qrCode }} style={styles.qrCodeImage} resizeMode="contain" />;
                                                        }
                                                        if (typeof qrCode === 'string' && qrCode.length > 100) {
                                                            return <Image source={{ uri: `data:image/png;base64,${qrCode}` }} style={styles.qrCodeImage} resizeMode="contain" />;
                                                        }
                                                        return (
                                                            <View style={{ alignItems: 'center' }}>
                                                                <Icon name="qr-code-2" size={80} color="#667eea" />
                                                                <Text style={{ marginTop: 8, color: '#666', fontSize: 12 }}>{qrCode}</Text>
                                                            </View>
                                                        );
                                                    })()}
                                                </View>
                                            </View>
                                        )}

                                    </>
                                )}
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setDetailModalVisible(false)}
                                >
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </MemberLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    kitName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    rentalId: {
        fontSize: 12,
        color: '#999',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    viewButtonText: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '600',
        marginRight: 4,
    },

    // Toggle Styles
    toggleContainer: {
        flexDirection: 'row',
        padding: 16,
        paddingBottom: 0,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
        borderRadius: 8,
    },
    toggleButtonActive: {
        backgroundColor: '#667eea',
    },
    toggleButtonDisabled: {
        opacity: 0.5,
    },
    toggleText: {
        color: '#666',
        fontWeight: '600',
    },
    toggleTextActive: {
        color: 'white',
    },
    toggleTextDisabled: {
        color: '#999',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        padding: 16,
        maxHeight: 500,
    },
    detailSection: {
        marginBottom: 16,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    modalFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        alignItems: 'center',
    },
    closeButton: {
        backgroundColor: '#667eea',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },

    // QR Code
    qrCodeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
    },
    qrCodeImage: {
        width: 200,
        height: 200,
    },
});

export default BorrowTracking;
