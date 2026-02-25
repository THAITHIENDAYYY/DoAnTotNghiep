using Microsoft.AspNetCore.Mvc;

namespace fastfood.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FileUploadController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<FileUploadController> _logger;
    private readonly string _uploadFolder;
    private readonly long _maxFileSizeInBytes;
    private readonly string[] _allowedExtensions;

    public FileUploadController(IConfiguration configuration, ILogger<FileUploadController> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        _uploadFolder = _configuration["FileUpload:UploadFolder"] ?? "wwwroot/uploads";
        var maxSizeInMB = int.Parse(_configuration["FileUpload:MaxFileSizeInMB"] ?? "5");
        _maxFileSizeInBytes = maxSizeInMB * 1024 * 1024;
        _allowedExtensions = _configuration.GetSection("FileUpload:AllowedExtensions").Get<string[]>() 
            ?? new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    }

    /// <summary>
    /// Upload single image file
    /// </summary>
    [HttpPost("upload")]
    public async Task<ActionResult<UploadResultDto>> UploadImage(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Không có file nào được chọn" });
            }

            // Validate file size
            if (file.Length > _maxFileSizeInBytes)
            {
                return BadRequest(new { message = $"Kích thước file vượt quá {_maxFileSizeInBytes / 1024 / 1024}MB" });
            }

            // Validate file extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = $"Chỉ chấp nhận các định dạng: {string.Join(", ", _allowedExtensions)}" });
            }

            // Create upload directory if not exists
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), _uploadFolder);
            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative URL
            var fileUrl = $"/uploads/{fileName}";

            _logger.LogInformation("File uploaded successfully: {FileName}", fileName);

            return Ok(new UploadResultDto
            {
                FileName = fileName,
                FileUrl = fileUrl,
                FileSize = file.Length,
                ContentType = file.ContentType
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file");
            return StatusCode(500, new { message = "Lỗi khi upload file" });
        }
    }

    /// <summary>
    /// Upload multiple images
    /// </summary>
    [HttpPost("upload-multiple")]
    public async Task<ActionResult<List<UploadResultDto>>> UploadMultipleImages(List<IFormFile> files)
    {
        try
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest(new { message = "Không có file nào được chọn" });
            }

            var results = new List<UploadResultDto>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                // Validate file size
                if (file.Length > _maxFileSizeInBytes)
                {
                    return BadRequest(new { message = $"File {file.FileName} vượt quá kích thước cho phép" });
                }

                // Validate file extension
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!_allowedExtensions.Contains(extension))
                {
                    return BadRequest(new { message = $"File {file.FileName} có định dạng không hợp lệ" });
                }

                // Create upload directory if not exists
                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), _uploadFolder);
                if (!Directory.Exists(uploadPath))
                {
                    Directory.CreateDirectory(uploadPath);
                }

                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadPath, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return relative URL
                var fileUrl = $"/uploads/{fileName}";

                results.Add(new UploadResultDto
                {
                    FileName = fileName,
                    FileUrl = fileUrl,
                    FileSize = file.Length,
                    ContentType = file.ContentType
                });
            }

            _logger.LogInformation("Uploaded {Count} files successfully", results.Count);

            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading multiple files");
            return StatusCode(500, new { message = "Lỗi khi upload files" });
        }
    }

    /// <summary>
    /// Delete uploaded file
    /// </summary>
    [HttpDelete("{fileName}")]
    public IActionResult DeleteFile(string fileName)
    {
        try
        {
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), _uploadFolder);
            var filePath = Path.Combine(uploadPath, fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "File không tồn tại" });
            }

            System.IO.File.Delete(filePath);
            _logger.LogInformation("File deleted successfully: {FileName}", fileName);

            return Ok(new { message = "Xóa file thành công" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {FileName}", fileName);
            return StatusCode(500, new { message = "Lỗi khi xóa file" });
        }
    }
}

public class UploadResultDto
{
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
}

