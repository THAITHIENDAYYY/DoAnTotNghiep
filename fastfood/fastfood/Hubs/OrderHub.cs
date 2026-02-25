using Microsoft.AspNetCore.SignalR;

namespace fastfood.Hubs;

/// <summary>
/// SignalR Hub for real-time order notifications
/// </summary>
public class OrderHub : Hub
{
    private readonly ILogger<OrderHub> _logger;

    public OrderHub(ILogger<OrderHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Called when a client connects
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Called when a client disconnects
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Send new order notification to all connected clients
    /// </summary>
    public async Task NotifyNewOrder(int orderId, string orderNumber, string customerName, decimal totalAmount)
    {
        _logger.LogInformation("Broadcasting new order: {OrderId}", orderId);
        
        await Clients.All.SendAsync("ReceiveNewOrder", new
        {
            orderId,
            orderNumber,
            customerName,
            totalAmount,
            timestamp = DateTime.Now
        });
    }

    /// <summary>
    /// Send order status update notification
    /// </summary>
    public async Task NotifyOrderStatusUpdate(int orderId, string orderNumber, string status)
    {
        _logger.LogInformation("Broadcasting order status update: {OrderId} - {Status}", orderId, status);
        
        await Clients.All.SendAsync("ReceiveOrderStatusUpdate", new
        {
            orderId,
            orderNumber,
            status,
            timestamp = DateTime.Now
        });
    }

    /// <summary>
    /// Send low stock alert notification
    /// </summary>
    public async Task NotifyLowStock(int productId, string productName, int currentStock)
    {
        _logger.LogInformation("Broadcasting low stock alert: {ProductName} - {Stock}", productName, currentStock);
        
        await Clients.All.SendAsync("ReceiveLowStockAlert", new
        {
            productId,
            productName,
            currentStock,
            timestamp = DateTime.Now
        });
    }

    /// <summary>
    /// Join a specific room/group (e.g., by employee role)
    /// </summary>
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("Client {ConnectionId} joined group {GroupName}", Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Leave a specific room/group
    /// </summary>
    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("Client {ConnectionId} left group {GroupName}", Context.ConnectionId, groupName);
    }
}

