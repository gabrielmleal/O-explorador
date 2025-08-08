#!/usr/bin/env python3
"""
Task Decomposer Script
Uses Claude Code SDK to analyze context and break it down into implementable tasks
"""

import argparse
import json
import os
import sys
import yaml
from typing import List, Dict, Any
from pathlib import Path

try:
    from anthropic import Anthropic
except ImportError:
    print("Error: anthropic SDK not installed. Run: pip install anthropic", file=sys.stderr)
    sys.exit(1)


class TaskDecomposer:
    """Decomposes project context into actionable development tasks"""
    
    def __init__(self, oauth_token: str = None, config_path: str = None):
        """Initialize the task decomposer with OAuth token and optional config"""
        self.oauth_token = oauth_token or os.environ.get('CLAUDE_CODE_OAUTH_TOKEN') or os.environ.get('ANTHROPIC_API_KEY')
        if not self.oauth_token:
            raise ValueError("CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY not found in environment variables")
        
        self.config = self._load_config(config_path) if config_path else {}
        self.client = Anthropic(api_key=self.oauth_token)
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        config_file = Path(config_path)
        if config_file.exists():
            with open(config_file, 'r') as f:
                return yaml.safe_load(f) or {}
        return {}
    
    def _test_anthropic_connection(self):
        """Test connection to Anthropic API"""
        try:
            # Test API access with a simple request
            self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                messages=[{"role": "user", "content": "test"}]
            )
            print("Successfully connected to Anthropic API", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Cannot connect to Anthropic API: {e}", file=sys.stderr)
    
    def decompose(self, context: str, max_tasks: int = 10) -> Dict[str, Any]:
        """
        Decompose context into tasks using Claude Code CLI
        
        Args:
            context: The project context or requirements to decompose
            max_tasks: Maximum number of tasks to generate
        
        Returns:
            Dictionary containing tasks and metadata
        """
        # Read project guidelines if available
        project_context = ""
        claude_md = Path("CLAUDE.md")
        if claude_md.exists():
            with open(claude_md, 'r') as f:
                project_context = f.read()
        
        # Construct the decomposition prompt
        prompt = self._build_decomposition_prompt(context, project_context, max_tasks)
        
        try:
            # Use Anthropic API to analyze and decompose
            response = self._call_anthropic_api(prompt)
            
            # Parse and validate the response
            tasks_data = self._parse_response(response)
            
            # Enhance tasks with additional metadata
            tasks_data = self._enhance_tasks(tasks_data, context)
            
            return tasks_data
            
        except Exception as e:
            print(f"Error during decomposition: {e}", file=sys.stderr)
            # Return a fallback structure
            return {
                "success": False,
                "error": str(e),
                "tasks": [],
                "context_summary": context[:200]
            }
    
    def _call_anthropic_api(self, prompt: str) -> str:
        """Call Anthropic API with the given prompt"""
        try:
            # Call Anthropic API
            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=4000,
                temperature=0.1,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            return response.content[0].text
                
        except Exception as e:
            raise RuntimeError(f"Anthropic API call failed: {e}")
    
    def _build_decomposition_prompt(self, context: str, project_context: str, max_tasks: int) -> str:
        """Build the prompt for task decomposition"""
        return f"""Analyze the following project context and requirements, then break it down into specific, implementable development tasks.

PROJECT CONTEXT:
{project_context}

REQUIREMENTS TO DECOMPOSE:
{context}

Please decompose this into no more than {max_tasks} specific, actionable tasks that can be implemented independently.

For each task, provide:
1. A clear, concise title (max 100 chars)
2. A detailed description of what needs to be implemented
3. Estimated complexity (low/medium/high)
4. Dependencies on other tasks (if any)
5. Success criteria
6. Suggested implementation approach
7. Files that likely need to be created or modified

Output the tasks as a JSON object with the following structure:
{{
  "context_summary": "Brief summary of the overall context",
  "total_complexity": "overall complexity assessment",
  "tasks": [
    {{
      "id": "task_1",
      "title": "Task title",
      "description": "Detailed description",
      "complexity": "low|medium|high",
      "dependencies": ["task_id"],
      "success_criteria": ["criterion 1", "criterion 2"],
      "implementation_notes": "Suggested approach",
      "affected_files": ["file1.py", "file2.js"],
      "estimated_hours": 2,
      "priority": 1
    }}
  ],
  "implementation_order": ["task_1", "task_2"],
  "parallel_tasks": [["task_3", "task_4"]],
  "risks": ["potential risk 1"],
  "assumptions": ["assumption 1"]
}}

Focus on creating tasks that are:
- Specific and well-defined
- Independently implementable (minimize dependencies)
- Testable with clear success criteria
- Appropriately sized (not too large or too small)

Think step by step and ensure the decomposition is logical and complete."""
    
    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Parse and validate Claude's response"""
        try:
            # If response is already a dict, use it directly
            if isinstance(response, dict):
                data = response
            else:
                # Try to parse as JSON
                data = json.loads(response)
            
            # Validate required fields
            if "tasks" not in data:
                data["tasks"] = []
            
            # Ensure each task has required fields
            for i, task in enumerate(data["tasks"]):
                if "id" not in task:
                    task["id"] = f"task_{i+1}"
                if "title" not in task:
                    task["title"] = f"Task {i+1}"
                if "description" not in task:
                    task["description"] = "No description provided"
                if "complexity" not in task:
                    task["complexity"] = "medium"
                if "dependencies" not in task:
                    task["dependencies"] = []
                if "priority" not in task:
                    task["priority"] = i + 1
            
            return data
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON response: {e}", file=sys.stderr)
            # Try to extract tasks from text response
            return self._extract_tasks_from_text(response)
    
    def _extract_tasks_from_text(self, text: str) -> Dict[str, Any]:
        """Fallback method to extract tasks from non-JSON response"""
        # Simple extraction based on numbered lists or bullet points
        lines = text.split('\n')
        tasks = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('*')):
                # Extract task title from the line
                title = line.lstrip('0123456789.-* ').strip()
                if title:
                    tasks.append({
                        "id": f"task_{len(tasks)+1}",
                        "title": title[:100],
                        "description": title,
                        "complexity": "medium",
                        "dependencies": [],
                        "priority": len(tasks) + 1
                    })
        
        return {
            "tasks": tasks,
            "context_summary": "Tasks extracted from text response",
            "total_complexity": "unknown"
        }
    
    def _enhance_tasks(self, tasks_data: Dict[str, Any], original_context: str) -> Dict[str, Any]:
        """Enhance tasks with additional metadata and validation"""
        # Add metadata
        tasks_data["metadata"] = {
            "generated_by": "claude-task-decomposer",
            "version": "1.0.0",
            "original_context_length": len(original_context),
            "task_count": len(tasks_data.get("tasks", []))
        }
        
        # Sort tasks by priority if not already ordered
        if "implementation_order" not in tasks_data and tasks_data.get("tasks"):
            tasks_data["implementation_order"] = [
                task["id"] for task in sorted(
                    tasks_data["tasks"],
                    key=lambda x: x.get("priority", 999)
                )
            ]
        
        # Identify parallel execution opportunities if not specified
        if "parallel_tasks" not in tasks_data:
            tasks_data["parallel_tasks"] = self._identify_parallel_tasks(tasks_data.get("tasks", []))
        
        return tasks_data
    
    def _identify_parallel_tasks(self, tasks: List[Dict[str, Any]]) -> List[List[str]]:
        """Identify tasks that can be executed in parallel"""
        parallel_groups = []
        
        # Group tasks with no dependencies
        no_deps = [
            task["id"] for task in tasks
            if not task.get("dependencies", [])
        ]
        
        if len(no_deps) > 1:
            parallel_groups.append(no_deps)
        
        return parallel_groups


def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description='Decompose project context into implementable tasks')
    parser.add_argument(
        '--context',
        required=True,
        help='Project context or requirements to decompose'
    )
    parser.add_argument(
        '--max-tasks',
        type=int,
        default=10,
        help='Maximum number of tasks to generate (default: 10)'
    )
    parser.add_argument(
        '--output',
        default='tasks.json',
        help='Output file for tasks (default: tasks.json)'
    )
    parser.add_argument(
        '--config',
        help='Path to configuration file'
    )
    parser.add_argument(
        '--oauth-token',
        help='Claude/Anthropic API token (defaults to CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY env var)'
    )
    
    args = parser.parse_args()
    
    try:
        # Initialize decomposer
        decomposer = TaskDecomposer(
            oauth_token=getattr(args, 'oauth_token', None),
            config_path=args.config
        )
        
        # Decompose the context
        print(f"Decomposing context into tasks (max: {args.max_tasks})...", file=sys.stderr)
        result = decomposer.decompose(args.context, args.max_tasks)
        
        # Save results
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"Successfully generated {len(result.get('tasks', []))} tasks", file=sys.stderr)
        print(f"Results saved to {args.output}", file=sys.stderr)
        
        # Print summary
        if result.get("tasks"):
            print("\nTask Summary:", file=sys.stderr)
            for task in result["tasks"]:
                print(f"  - {task['id']}: {task['title']} [{task.get('complexity', 'unknown')}]", file=sys.stderr)
        
        return 0
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())