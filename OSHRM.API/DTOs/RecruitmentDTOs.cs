namespace OSHRM.API.DTOs
{
    public class CandidateDto
    {
        public int CandidateId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public string Stage { get; set; } = "Applied"; // Applied, Screening, Interview, Offer, Hired, Rejected
        public string AppliedDate { get; set; } = string.Empty;
        public int Score { get; set; } = 80;
    }

    public class CreateCandidateDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
    }

    public class UpdateStageDto
    {
        public int CandidateId { get; set; }
        public string NewStage { get; set; } = string.Empty;
    }
}